import type { Request, Response, NextFunction } from 'express';

/** Wrap an async route to propagate errors to the global handler. */
export const catchAsync =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next); 