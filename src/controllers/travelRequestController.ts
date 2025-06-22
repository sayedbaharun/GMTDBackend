import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../types/express';
import { logger } from '../utils/logger';
import { TravelRequestStatus, TravelRequestType, TravelRequestPriority } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * # Travel Request Controller
 * Handles travel request operations between users and admins
 */

/**
 * Create a new travel request from a conversation message
 * @route POST /api/travel-requests
 */
export const createTravelRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { 
      conversationId, 
      messageId,
      requestType, 
      description,
      priority = TravelRequestPriority.NORMAL,
      deadline
    } = req.body;
    
    // Validate required fields
    if (!conversationId || !messageId || !requestType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Verify that the conversation exists and user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: conversationId,
        userId: user.id
      },
      include: {
        conversation: true
      }
    });
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or user is not a participant'
      });
    }
    
    // Create travel request
    const travelRequest = await prisma.travelRequest.create({
      data: {
        userId: user.id,
        conversationId,
        messageId,
        requestType,
        description,
        priority,
        deadline: deadline ? new Date(deadline) : undefined,
        status: TravelRequestStatus.PENDING
      }
    });
    
    // Add a system message to the conversation indicating a travel request was created
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        content: `Travel request created: ${requestType}`,
        contentType: 'SYSTEM',
        isSystem: true,
        metadata: {
          travelRequestId: travelRequest.id,
          requestType,
          status: TravelRequestStatus.PENDING
        }
      }
    });
    
    return res.status(201).json({
      success: true,
      travelRequest
    });
  } catch (error: any) {
    logger.error('Error creating travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create travel request',
      error: error.message
    });
  }
};

/**
 * Get all travel requests for the current user
 * @route GET /api/travel-requests
 */
export const getUserTravelRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const travelRequests = await prisma.travelRequest.findMany({
      where: {
        userId: user.id
      },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            title: true
          }
        },
        relatedBooking: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return res.status(200).json({
      success: true,
      travelRequests
    });
  } catch (error: any) {
    logger.error('Error fetching user travel requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch travel requests',
      error: error.message
    });
  }
};

/**
 * Get a specific travel request by ID
 * @route GET /api/travel-requests/:id
 */
export const getTravelRequestById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            title: true
          }
        },
        relatedBooking: true
      }
    });
    
    if (!travelRequest) {
      return res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
    }
    
    // Check if the user is authorized to view this request
    if (travelRequest.userId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this travel request'
      });
    }
    
    return res.status(200).json({
      success: true,
      travelRequest
    });
  } catch (error: any) {
    logger.error('Error fetching travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch travel request',
      error: error.message
    });
  }
};

/**
 * Update a travel request (Admin only)
 * @route PUT /api/travel-requests/:id
 */
export const updateTravelRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Only admins can update travel requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update travel requests'
      });
    }
    
    const { 
      status, 
      requirementsSummary, 
      searchParams,
      adminId,
      priority,
      deadline,
      presentedOptions
    } = req.body;
    
    // Find the travel request
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        conversation: true
      }
    });
    
    if (!travelRequest) {
      return res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
    }
    
    // Update the travel request
    const updatedRequest = await prisma.travelRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: status,
        requirementsSummary,
        searchParams,
        adminId: adminId || user.id, // Default to current admin if not specified
        priority,
        deadline: deadline ? new Date(deadline) : undefined,
        presentedOptions,
        updatedAt: new Date()
      }
    });
    
    // Add a system message to the conversation if status changed
    if (status && status !== travelRequest.status && travelRequest.conversationId) {
      await prisma.message.create({
        data: {
          conversationId: travelRequest.conversationId,
          senderId: user.id,
          content: `Travel request status changed to: ${status}`,
          contentType: 'SYSTEM',
          isSystem: true,
          metadata: {
            travelRequestId: travelRequest.id,
            requestType: travelRequest.requestType,
            oldStatus: travelRequest.status,
            newStatus: status
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      travelRequest: updatedRequest
    });
  } catch (error: any) {
    logger.error('Error updating travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update travel request',
      error: error.message
    });
  }
};

/**
 * Present options to the user for a travel request
 * @route POST /api/travel-requests/:id/present-options
 */
export const presentOptions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Only admins can present options
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can present options'
      });
    }
    
    const { options } = req.body;
    
    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Options array is required and must contain at least one option'
      });
    }
    
    // Find the travel request
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        conversation: true
      }
    });
    
    if (!travelRequest) {
      return res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
    }
    
    // Add IDs to options if they don't have them
    const optionsWithIds = options.map(option => {
      if (!option.id) {
        return {
          ...option,
          id: uuidv4()
        };
      }
      return option;
    });
    
    // Update the travel request with the options and change status
    const updatedRequest = await prisma.travelRequest.update({
      where: {
        id: requestId
      },
      data: {
        status: TravelRequestStatus.OPTIONS_PRESENTED,
        presentedOptions: optionsWithIds,
        updatedAt: new Date()
      }
    });
    
    // Add a message to the conversation with the options
    if (travelRequest.conversationId) {
      await prisma.message.create({
        data: {
          conversationId: travelRequest.conversationId,
          senderId: user.id,
          content: `I've found some options for your ${travelRequest.requestType.toLowerCase()} request:`,
          contentType: 'TEXT',
          metadata: {
            travelRequestId: travelRequest.id,
            options: optionsWithIds
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      travelRequest: updatedRequest
    });
  } catch (error: any) {
    logger.error('Error presenting options for travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to present options',
      error: error.message
    });
  }
};

/**
 * Select an option for a travel request (User)
 * @route POST /api/travel-requests/:id/select-option
 */
export const selectOption = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const { optionId } = req.body;
    
    if (!optionId) {
      return res.status(400).json({
        success: false,
        message: 'Option ID is required'
      });
    }
    
    // Find the travel request
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        conversation: true
      }
    });
    
    if (!travelRequest) {
      return res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
    }
    
    // Check if the user is authorized to select an option for this request
    if (travelRequest.userId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to select an option for this travel request'
      });
    }
    
    // Check if the option exists in the presented options
    const options = travelRequest.presentedOptions as any[] || [];
    const selectedOption = options.find(option => option.id === optionId);
    
    if (!selectedOption) {
      return res.status(404).json({
        success: false,
        message: 'Option not found in the presented options'
      });
    }
    
    // Update the travel request with the selected option
    const updatedRequest = await prisma.travelRequest.update({
      where: {
        id: requestId
      },
      data: {
        selectedOptionId: optionId,
        updatedAt: new Date()
      }
    });
    
    // Add a message to the conversation indicating the selected option
    if (travelRequest.conversationId) {
      await prisma.message.create({
        data: {
          conversationId: travelRequest.conversationId,
          senderId: user.id,
          content: `I've selected the ${selectedOption.title} option.`,
          contentType: 'TEXT',
          metadata: {
            travelRequestId: travelRequest.id,
            selectedOptionId: optionId
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      travelRequest: updatedRequest
    });
  } catch (error: any) {
    logger.error('Error selecting option for travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to select option',
      error: error.message
    });
  }
};

/**
 * Get all pending travel requests (Admin only)
 * @route GET /api/admin/travel-requests/pending
 */
export const getPendingTravelRequests = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Only admins can view all pending requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view all pending requests'
      });
    }
    
    const pendingRequests = await prisma.travelRequest.findMany({
      where: {
        status: TravelRequestStatus.PENDING
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        conversation: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        {
          priority: 'desc'
        },
        {
          createdAt: 'asc'
        }
      ]
    });
    
    return res.status(200).json({
      success: true,
      travelRequests: pendingRequests
    });
  } catch (error: any) {
    logger.error('Error fetching pending travel requests:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending travel requests',
      error: error.message
    });
  }
};

/**
 * Assign a travel request to an admin
 * @route POST /api/admin/travel-requests/:id/assign
 */
export const assignTravelRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Only admins can assign requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can assign requests'
      });
    }
    
    const { adminId } = req.body;
    
    // Default to self-assignment if no adminId specified
    const assignToId = adminId || user.id;
    
    // Update the travel request
    const updatedRequest = await prisma.travelRequest.update({
      where: {
        id: requestId
      },
      data: {
        adminId: assignToId,
        status: TravelRequestStatus.PROCESSING,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        conversation: true
      }
    });
    
    // Add a system message to the conversation
    if (updatedRequest.conversationId) {
      await prisma.message.create({
        data: {
          conversationId: updatedRequest.conversationId,
          senderId: user.id,
          content: `Your travel request is now being processed by an agent.`,
          contentType: 'SYSTEM',
          isSystem: true,
          metadata: {
            travelRequestId: updatedRequest.id,
            adminId: assignToId
          }
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      travelRequest: updatedRequest
    });
  } catch (error: any) {
    logger.error('Error assigning travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign travel request',
      error: error.message
    });
  }
};

/**
 * Convert a travel request to a booking (Admin only)
 * @route POST /api/admin/travel-requests/:id/convert
 */
export const convertToBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const requestId = req.params.id;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Only admins can convert requests to bookings
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can convert requests to bookings'
      });
    }
    
    const { bookingDetails } = req.body;
    
    if (!bookingDetails) {
      return res.status(400).json({
        success: false,
        message: 'Booking details are required'
      });
    }
    
    // Find the travel request
    const travelRequest = await prisma.travelRequest.findUnique({
      where: {
        id: requestId
      },
      include: {
        user: true,
        conversation: true
      }
    });
    
    if (!travelRequest) {
      return res.status(404).json({
        success: false,
        message: 'Travel request not found'
      });
    }
    
    // Start a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create a new booking based on the travel request
      const booking = await tx.booking.create({
        data: {
          userId: travelRequest.userId,
          status: 'CONFIRMED',
          totalPrice: bookingDetails.totalPrice,
          paymentStatus: bookingDetails.paymentStatus || 'UNPAID',
          paymentIntentId: bookingDetails.paymentIntentId,
          // Add specific booking data based on request type
          ...(travelRequest.requestType === TravelRequestType.FLIGHT && bookingDetails.flightDetails && {
            flightBookings: {
              create: bookingDetails.flightDetails
            }
          }),
          ...(travelRequest.requestType === TravelRequestType.HOTEL && bookingDetails.hotelDetails && {
            hotelBookings: {
              create: bookingDetails.hotelDetails
            }
          })
        }
      });
      
      // Update the travel request with the booking reference
      const updatedRequest = await tx.travelRequest.update({
        where: {
          id: requestId
        },
        data: {
          status: TravelRequestStatus.BOOKED,
          relatedBookingId: booking.id,
          updatedAt: new Date()
        }
      });
      
      // Add a message to the conversation
      if (travelRequest.conversationId) {
        await tx.message.create({
          data: {
            conversationId: travelRequest.conversationId,
            senderId: user.id,
            content: `Great news! Your travel request has been converted to a booking.`,
            contentType: 'TEXT',
            metadata: {
              travelRequestId: updatedRequest.id,
              bookingId: booking.id
            }
          }
        });
      }
      
      return { booking, updatedRequest };
    });
    
    return res.status(200).json({
      success: true,
      booking: result.booking,
      travelRequest: result.updatedRequest
    });
  } catch (error: any) {
    logger.error('Error converting travel request to booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert travel request to booking',
      error: error.message
    });
  }
};

/**
 * Detect travel requests from conversation messages (AI-assisted)
 * @route POST /api/messages/:messageId/detect-travel-request
 */
export const detectTravelRequest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    const messageId = req.params.messageId;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find the message
    const message = await prisma.message.findUnique({
      where: {
        id: messageId
      },
      include: {
        conversation: true,
        sender: true
      }
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Check if the user is authorized to access this message
    const isParticipant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: message.conversationId,
        userId: user.id
      }
    });
    
    if (!isParticipant && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this message'
      });
    }
    
    // Here you would integrate with an AI service to detect travel intent
    // For now, we'll just do basic keyword detection
    const content = message.content.toLowerCase();
    let detectedType = null;
    
    if (content.includes('flight') || content.includes('fly') || content.includes('plane')) {
      detectedType = TravelRequestType.FLIGHT;
    } else if (content.includes('hotel') || content.includes('stay') || content.includes('room')) {
      detectedType = TravelRequestType.HOTEL;
    } else if (content.includes('car') || content.includes('rent') || content.includes('vehicle')) {
      detectedType = TravelRequestType.CAR_RENTAL;
    } else if (content.includes('yacht') || content.includes('boat')) {
      detectedType = TravelRequestType.YACHT;
    } else if (content.includes('restaurant') || content.includes('dinner') || content.includes('lunch')) {
      detectedType = TravelRequestType.RESTAURANT;
    } else if (content.includes('transport') || content.includes('taxi') || content.includes('transfer')) {
      detectedType = TravelRequestType.TRANSPORTATION;
    } else if (content.includes('package') || content.includes('vacation') || content.includes('holiday')) {
      detectedType = TravelRequestType.PACKAGE;
    }
    
    if (!detectedType) {
      return res.status(200).json({
        success: true,
        travelRequestDetected: false
      });
    }
    
    // Create a travel request from the detected intent
    const travelRequest = await prisma.travelRequest.create({
      data: {
        userId: message.senderId,
        conversationId: message.conversationId,
        messageId: message.id,
        requestType: detectedType,
        description: message.content,
        status: TravelRequestStatus.PENDING
      }
    });
    
    // Add a system message to acknowledge the request
    await prisma.message.create({
      data: {
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: `We've detected a ${detectedType.toLowerCase()} request. A travel agent will assist you shortly.`,
        contentType: 'SYSTEM',
        isSystem: true,
        metadata: {
          travelRequestId: travelRequest.id,
          requestType: detectedType
        }
      }
    });
    
    return res.status(200).json({
      success: true,
      travelRequestDetected: true,
      travelRequest
    });
  } catch (error: any) {
    logger.error('Error detecting travel request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to detect travel request',
      error: error.message
    });
  }
}; 