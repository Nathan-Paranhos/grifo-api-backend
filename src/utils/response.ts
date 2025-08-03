import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export const sendSuccess = <T>(res: Response, data: T, message?: string, statusCode = 200) => {
  const response: ApiResponse<T> & { message?: string } = {
    success: true,
    data,
    error: null,
    ...(message && { message }),
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