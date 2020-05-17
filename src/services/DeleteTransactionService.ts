import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionRepo = getCustomRepository(TransactionsRepository);
    const transactionToDelete = await transactionRepo.findOne(id);
    if (!transactionToDelete) throw new AppError('Transaction not found.');

    await transactionRepo.remove(transactionToDelete);
  }
}

export default DeleteTransactionService;
