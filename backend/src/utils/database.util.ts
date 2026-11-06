import mongoose from 'mongoose';

export const isValidObjectId = (id: unknown): boolean => {
  if (!id) return false;
  if (typeof id !== 'string' && !(id instanceof mongoose.Types.ObjectId)) {
    return false;
  }
  return mongoose.Types.ObjectId.isValid(id as string);
};

export const toObjectId = (id: string | mongoose.Types.ObjectId): mongoose.Types.ObjectId => {
  if (id instanceof mongoose.Types.ObjectId) return id;
  return new mongoose.Types.ObjectId(id);
};

