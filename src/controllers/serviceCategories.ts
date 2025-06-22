import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { ApiError } from '../types';
import { prisma } from '../lib/prisma';

/**
 * # Service Category Controller
 * Handles CRUD operations for travel service categories (Hotel Bookings, Flight Bookings, etc.)
 */

/**
 * Get all service categories
 * @route GET /api/services/categories
 */
export const getAllServiceCategories = async (req: Request, res: Response) => {
  try {
    // DEVELOPMENT MOCK: Return mock data instead of hitting database
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Hotel Bookings',
        slug: 'hotel-bookings',
        description: 'Luxury hotel and resort bookings in Dubai',
        imageUrl: 'https://example.com/images/hotels.jpg',
        iconName: 'bi-building',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          amenities: ['Spa', 'Pool', 'Gym', 'Restaurant'],
          starRatings: [3, 4, 5]
        }
      },
      {
        id: 'cat-2',
        name: 'Flight Bookings',
        slug: 'flight-bookings',
        description: 'First class and business class flights to Dubai',
        imageUrl: 'https://example.com/images/flights.jpg',
        iconName: 'bi-airplane',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          airlines: ['Emirates', 'Etihad Airways', 'Qatar Airways'],
          classes: ['Economy', 'Business', 'First Class']
        }
      },
      {
        id: 'cat-3',
        name: 'Restaurant Bookings',
        slug: 'restaurant-bookings',
        description: 'High-end and exclusive restaurant reservations',
        imageUrl: 'https://example.com/images/restaurants.jpg',
        iconName: 'bi-cup-hot',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          cuisines: ['Arabic', 'International', 'Seafood', 'Fine Dining'],
          specialDiets: ['Vegetarian', 'Vegan', 'Gluten-Free']
        }
      },
      {
        id: 'cat-4',
        name: 'Car Hire',
        slug: 'car-hire',
        description: 'Premium car rental services in Dubai',
        imageUrl: 'https://example.com/images/car-rentals.jpg',
        iconName: 'bi-car-front',
        isActive: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Economy', 'Luxury', 'SUV']
        }
      },
      {
        id: 'cat-5',
        name: 'Supercar Hire',
        slug: 'supercar-hire',
        description: 'Exotic and luxury supercar rentals',
        imageUrl: 'https://example.com/images/supercars.jpg',
        iconName: 'bi-car-front-fill',
        isActive: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          brands: ['Ferrari', 'Lamborghini', 'Bugatti', 'McLaren', 'Rolls-Royce']
        }
      },
      {
        id: 'cat-6',
        name: 'Yacht Charters',
        slug: 'yacht-charters',
        description: 'Luxury yacht rentals and cruise experiences',
        imageUrl: 'https://example.com/images/yachts.jpg',
        iconName: 'bi-water',
        isActive: true,
        displayOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          sizes: ['40ft', '60ft', '100ft+'],
          amenities: ['Crew', 'Bar', 'Catering']
        }
      },
      {
        id: 'cat-7',
        name: 'Transportation',
        slug: 'transportation',
        description: 'Exclusive transportation services within Dubai',
        imageUrl: 'https://example.com/images/transportation.jpg',
        iconName: 'bi-truck',
        isActive: true,
        displayOrder: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Limousine', 'Helicopter', 'Private Jet']
        }
      },
      {
        id: 'cat-8',
        name: 'Unique Experiences',
        slug: 'unique-experiences',
        description: 'One-of-a-kind premium Dubai experiences',
        imageUrl: 'https://example.com/images/experiences.jpg',
        iconName: 'bi-stars',
        isActive: true,
        displayOrder: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Desert Safari', 'Cultural Tours', 'Sky Diving', 'Luxury Shopping']
        }
      }
    ];

    // In production, we would fetch from database:
    // const categories = await prisma.serviceCategory.findMany({
    //   orderBy: { displayOrder: 'asc' }
    // });

    return res.status(200).json({
      success: true,
      data: mockCategories
    });
  } catch (error) {
    console.error('Error fetching service categories:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch service categories', 500);
  }
};

/**
 * Get a service category by slug
 * @route GET /api/services/categories/:slug
 */
export const getServiceCategoryBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // For development, find the mock category with matching slug
    const mockCategories = [
      {
        id: 'cat-1',
        name: 'Hotel Bookings',
        slug: 'hotel-bookings',
        description: 'Luxury hotel and resort bookings in Dubai',
        imageUrl: 'https://example.com/images/hotels.jpg',
        iconName: 'bi-building',
        isActive: true,
        displayOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          amenities: ['Spa', 'Pool', 'Gym', 'Restaurant'],
          starRatings: [3, 4, 5]
        }
      },
      {
        id: 'cat-2',
        name: 'Flight Bookings',
        slug: 'flight-bookings',
        description: 'First class and business class flights to Dubai',
        imageUrl: 'https://example.com/images/flights.jpg',
        iconName: 'bi-airplane',
        isActive: true,
        displayOrder: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          airlines: ['Emirates', 'Etihad Airways', 'Qatar Airways'],
          classes: ['Economy', 'Business', 'First Class']
        }
      },
      {
        id: 'cat-3',
        name: 'Restaurant Bookings',
        slug: 'restaurant-bookings',
        description: 'High-end and exclusive restaurant reservations',
        imageUrl: 'https://example.com/images/restaurants.jpg',
        iconName: 'bi-cup-hot',
        isActive: true,
        displayOrder: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          cuisines: ['Arabic', 'International', 'Seafood', 'Fine Dining'],
          specialDiets: ['Vegetarian', 'Vegan', 'Gluten-Free']
        }
      },
      {
        id: 'cat-4',
        name: 'Car Hire',
        slug: 'car-hire',
        description: 'Premium car rental services in Dubai',
        imageUrl: 'https://example.com/images/car-rentals.jpg',
        iconName: 'bi-car-front',
        isActive: true,
        displayOrder: 4,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Economy', 'Luxury', 'SUV']
        }
      },
      {
        id: 'cat-5',
        name: 'Supercar Hire',
        slug: 'supercar-hire',
        description: 'Exotic and luxury supercar rentals',
        imageUrl: 'https://example.com/images/supercars.jpg',
        iconName: 'bi-car-front-fill',
        isActive: true,
        displayOrder: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          brands: ['Ferrari', 'Lamborghini', 'Bugatti', 'McLaren', 'Rolls-Royce']
        }
      },
      {
        id: 'cat-6',
        name: 'Yacht Charters',
        slug: 'yacht-charters',
        description: 'Luxury yacht rentals and cruise experiences',
        imageUrl: 'https://example.com/images/yachts.jpg',
        iconName: 'bi-water',
        isActive: true,
        displayOrder: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          sizes: ['40ft', '60ft', '100ft+'],
          amenities: ['Crew', 'Bar', 'Catering']
        }
      },
      {
        id: 'cat-7',
        name: 'Transportation',
        slug: 'transportation',
        description: 'Exclusive transportation services within Dubai',
        imageUrl: 'https://example.com/images/transportation.jpg',
        iconName: 'bi-truck',
        isActive: true,
        displayOrder: 7,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Limousine', 'Helicopter', 'Private Jet']
        }
      },
      {
        id: 'cat-8',
        name: 'Unique Experiences',
        slug: 'unique-experiences',
        description: 'One-of-a-kind premium Dubai experiences',
        imageUrl: 'https://example.com/images/experiences.jpg',
        iconName: 'bi-stars',
        isActive: true,
        displayOrder: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attributes: {
          types: ['Desert Safari', 'Cultural Tours', 'Sky Diving', 'Luxury Shopping']
        }
      }
    ];
    
    const category = mockCategories.find(cat => cat.slug === slug);

    if (!category) {
      throw new ApiError(`Service category with slug "${slug}" not found`, 404);
    }

    // In production:
    // const category = await prisma.serviceCategory.findUnique({
    //   where: { slug }
    // });
    
    // if (!category) {
    //   throw new ApiError(`Service category with slug "${slug}" not found`, 404);
    // }

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(`Error fetching service category by slug:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to fetch service category', 500);
  }
};

/**
 * Create a new service category (Admin only)
 * @route POST /api/admin/services/categories
 */
export const createServiceCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, slug, description, imageUrl, iconName, isActive, displayOrder, attributes } = req.body;

    // Basic validation
    if (!name || !slug) {
      throw new ApiError('Name and slug are required', 400);
    }

    // In production:
    // const existingCategory = await prisma.serviceCategory.findFirst({
    //   where: {
    //     OR: [
    //       { name },
    //       { slug }
    //     ]
    //   }
    // });
    
    // if (existingCategory) {
    //   throw new ApiError('A service category with that name or slug already exists', 400);
    // }
    
    // const newCategory = await prisma.serviceCategory.create({
    //   data: {
    //     name,
    //     slug,
    //     description,
    //     imageUrl,
    //     iconName,
    //     isActive: isActive ?? true,
    //     displayOrder: displayOrder ?? 0,
    //     attributes
    //   }
    // });

    // For development, mock a created category
    const newCategory = {
      id: `cat-${Date.now()}`,
      name,
      slug,
      description,
      imageUrl,
      iconName,
      isActive: isActive ?? true,
      displayOrder: displayOrder ?? 0,
      attributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(201).json({
      success: true,
      message: 'Service category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating service category:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to create service category', 500);
  }
};

/**
 * Update a service category (Admin only)
 * @route PUT /api/admin/services/categories/:id
 */
export const updateServiceCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, description, imageUrl, iconName, isActive, displayOrder, attributes } = req.body;

    // In production:
    // const existingCategory = await prisma.serviceCategory.findUnique({
    //   where: { id }
    // });
    
    // if (!existingCategory) {
    //   throw new ApiError(`Service category with ID ${id} not found`, 404);
    // }
    
    // if (slug && slug !== existingCategory.slug) {
    //   const slugExists = await prisma.serviceCategory.findFirst({
    //     where: { 
    //       slug,
    //       NOT: { id }
    //     }
    //   });
      
    //   if (slugExists) {
    //     throw new ApiError(`A service category with slug "${slug}" already exists`, 400);
    //   }
    // }
    
    // const updatedCategory = await prisma.serviceCategory.update({
    //   where: { id },
    //   data: {
    //     name,
    //     slug,
    //     description,
    //     imageUrl,
    //     iconName,
    //     isActive,
    //     displayOrder,
    //     attributes
    //   }
    // });

    // For development, mock an updated category
    const updatedCategory = {
      id,
      name,
      slug,
      description,
      imageUrl,
      iconName,
      isActive,
      displayOrder,
      attributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      message: 'Service category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Error updating service category:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to update service category', 500);
  }
};

/**
 * Delete a service category (Admin only)
 * @route DELETE /api/admin/services/categories/:id
 */
export const deleteServiceCategory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // In production:
    // const existingCategory = await prisma.serviceCategory.findUnique({
    //   where: { id }
    // });
    
    // if (!existingCategory) {
    //   throw new ApiError(`Service category with ID ${id} not found`, 404);
    // }
    
    // await prisma.serviceCategory.delete({
    //   where: { id }
    // });

    return res.status(200).json({
      success: true,
      message: 'Service category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service category:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Failed to delete service category', 500);
  }
}; 