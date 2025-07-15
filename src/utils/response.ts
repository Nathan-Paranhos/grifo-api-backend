import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  [key: string]: any;
}

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200, extra: Record<string, any> = {}) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    ...extra,
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, error: string, statusCode = 500) => {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error,
  };
  res.status(statusCode).json(response);
};