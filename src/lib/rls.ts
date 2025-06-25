import { Prisma } from '@prisma/client';

export const rlsMiddleware: Prisma.Middleware = async (params, next) => {
  const { model, action, args } = params;

  // List of models that should be protected by RLS
  const protectedModels = [
    'User',
    'Profile',
    'Booking',
    'BookingFlight',
    'BookingHotel',
    'ConciergeRequest',
    'Conversation',
    'ConversationParticipant',
    'Message',
    'TravelRequest',
    'UserPreferences',
    'ConversationMemory',
    'UserBehaviorAnalytics',
    'BookingConfirmation',
    'PaymentTransaction',
    'BookingAuditLog',
    'ComplianceRecord',
  ];

  if (protectedModels.includes(model as string)) {
    if (args.where?.userId) {
      // If a userId is already present in the where clause, we don't need to do anything
      return next(params);
    }

    if (args.userId) {
      // If a userId is present in the args, we need to add it to the where clause
      params.args = {
        ...args,
        where: {
          ...args.where,
          userId: args.userId,
        },
      };
    } else {
      // If no userId is present, we need to throw an error
      throw new Error('You are not authorized to perform this action.');
    }
  }

  return next(params);
};
