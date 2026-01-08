import Joi from 'joi';
import { AppError } from './errorHandler.js';

export const validate = (schema) => {
  return (req, res, next) => {
    // For GET requests, validate query parameters instead of body
    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    const { error } = schema.validate(dataToValidate, { abortEarly: false });
    
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
  }),

  playlistInfo: Joi.object({
    url: Joi.string().uri().required()
  }),

  playlistDownload: Joi.object({
    url: Joi.string().uri().required(),
    type: Joi.string().valid('video', 'audio').required(),
    quality: Joi.string().optional(),
    options: Joi.object({
      maxVideos: Joi.number().min(1).max(100).optional(),
      skipExisting: Joi.boolean().optional(),
      continueOnError: Joi.boolean().optional()
    }).optional()
  })
};
