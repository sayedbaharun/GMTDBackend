import * as express from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../types/express';

// Get all hotels with optional filtering
export const getAllHotels = async (req: express.Request, res: express.Response) => {
  try {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      minRating,
      maxRating,
      amenities,
    } = req.query;

    let whereClause: any = {};
    
    if (city) {
      whereClause.city = String(city);
    }
    
    if (country) {
      whereClause.country = String(country);
    }
    
    // Price range filtering
    if (minPrice || maxPrice) {
      whereClause.pricePerNight = {};
      
      if (minPrice) {
        whereClause.pricePerNight.gte = parseFloat(String(minPrice));
      }
      
      if (maxPrice) {
        whereClause.pricePerNight.lte = parseFloat(String(maxPrice));
      }
    }
    
    // Star rating filtering
    if (minRating || maxRating) {
      whereClause.starRating = {};
      
      if (minRating) {
        whereClause.starRating.gte = parseFloat(String(minRating));
      }
      
      if (maxRating) {
        whereClause.starRating.lte = parseFloat(String(maxRating));
      }
    }
    
    // Amenities filtering (find hotels that have all the requested amenities)
    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities.map(a => String(a))
        : [String(amenities)];
      
      whereClause.amenities = {
        hasEvery: amenitiesList,
      };
    }

    const hotels = await prisma.hotel.findMany({
      where: whereClause,
      include: {
        rooms: true, // Include room information
      },
      orderBy: {
        pricePerNight: 'asc',
      },
    });

    return res.status(200).json({
      success: true,
      data: hotels,
      count: hotels.length,
    });
  } catch (error: any) {
    console.error('Error fetching hotels:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch hotels',
      error: error.message,
    });
  }
};

// Get hotel by ID
export const getHotelById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        rooms: true, // Include room information
      },
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error: any) {
    console.error('Error fetching hotel:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch hotel',
      error: error.message,
    });
  }
};

// Get room by ID
export const getRoomById = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        hotel: true, // Include the hotel information
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    console.error('Error fetching room:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch room',
      error: error.message,
    });
  }
};

// Create a new hotel (admin only)
export const createHotel = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to create hotels',
    //   });
    // }

    const {
      name,
      description,
      address,
      city,
      country,
      zipCode,
      latitude,
      longitude,
      starRating,
      amenities,
      pricePerNight,
      currency,
      images,
    } = req.body;

    const hotel = await prisma.hotel.create({
      data: {
        name,
        description,
        address,
        city,
        country,
        zipCode,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        starRating: starRating ? parseFloat(starRating) : null,
        amenities: amenities || [],
        pricePerNight: parseFloat(pricePerNight),
        currency: currency || 'USD',
        images: images || [],
      },
    });

    return res.status(201).json({
      success: true,
      data: hotel,
      message: 'Hotel created successfully',
    });
  } catch (error: any) {
    console.error('Error creating hotel:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create hotel',
      error: error.message,
    });
  }
};

// Create a new room for a hotel (admin only)
export const createRoom = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to create rooms',
    //   });
    // }

    const { hotelId } = req.params;
    const {
      type,
      description,
      price,
      currency,
      capacity,
      amenities,
      available,
    } = req.body;

    // Check if hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const room = await prisma.room.create({
      data: {
        hotelId,
        type,
        description,
        price: parseFloat(price),
        currency: currency || 'USD',
        capacity: capacity ? parseInt(capacity, 10) : 2,
        amenities: amenities || [],
        available: available !== undefined ? available : true,
      },
    });

    return res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully',
    });
  } catch (error: any) {
    console.error('Error creating room:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to create room',
      error: error.message,
    });
  }
};

// Update hotel (admin only)
export const updateHotel = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update hotels',
    //   });
    // }

    const { id } = req.params;
    const updateData = req.body;

    // Process numeric fields
    if (updateData.pricePerNight) {
      updateData.pricePerNight = parseFloat(updateData.pricePerNight);
    }
    
    if (updateData.latitude) {
      updateData.latitude = parseFloat(updateData.latitude);
    }
    
    if (updateData.longitude) {
      updateData.longitude = parseFloat(updateData.longitude);
    }
    
    if (updateData.starRating) {
      updateData.starRating = parseFloat(updateData.starRating);
    }

    const hotel = await prisma.hotel.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: hotel,
      message: 'Hotel updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating hotel:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hotel',
      error: error.message,
    });
  }
};

// Update room (admin only)
export const updateRoom = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to update rooms',
    //   });
    // }

    const { id } = req.params;
    const updateData = req.body;

    // Process numeric fields
    if (updateData.price) {
      updateData.price = parseFloat(updateData.price);
    }
    
    if (updateData.capacity) {
      updateData.capacity = parseInt(updateData.capacity, 10);
    }

    const room = await prisma.room.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      data: room,
      message: 'Room updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating room:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to update room',
      error: error.message,
    });
  }
};

// Delete hotel (admin only)
export const deleteHotel = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete hotels',
    //   });
    // }

    const { id } = req.params;

    // Check if the hotel exists and has any active bookings
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    // Check if hotel has active bookings
    if (hotel.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete hotel with existing bookings',
      });
    }

    // Delete all rooms first (cascading delete should handle this, but we'll do it explicitly)
    await prisma.room.deleteMany({
      where: { hotelId: id },
    });

    // Delete the hotel
    await prisma.hotel.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Hotel and all rooms deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting hotel:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete hotel',
      error: error.message,
    });
  }
};

// Delete room (admin only)
export const deleteRoom = async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    // In a real application, check if user is admin
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Not authorized to delete rooms',
    //   });
    // }

    const { id } = req.params;

    // Check if the room exists
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
      });
    }

    // Check if room has active bookings
    if (room.bookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with existing bookings',
      });
    }

    // Delete the room
    await prisma.room.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting room:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete room',
      error: error.message,
    });
  }
};