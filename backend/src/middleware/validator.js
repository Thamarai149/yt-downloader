import Joi from 'joi';
import { AppError } from './errorHandler.js';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const message = error.details.map(detail => detail.message).join(', ');
      throw new AppError(message, 400);
    }
    
    next();
  };
};

export const schemas = {
  download: Joi.object({
    url: Joi.string().uri().required(),
    type: Joi.string().valid('video', 'audio').required(),
    quality: Joi.string().optional()
  }),
  
  info: Joi.object({
    url: Joi.string().uri().required()
  }),
  
  search: Joi.object({
    query: Joi.string().min(1).required(),
    limit: Joi.number().min(1).max(50).optional()
  })
};
