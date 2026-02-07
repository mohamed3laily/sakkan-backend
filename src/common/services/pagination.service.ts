import { Injectable } from '@nestjs/common';
import { PaginatedResponse } from '../types/pagination.types';

@Injectable()
export class PaginationService {
  createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
