import { getCustomRepository } from 'typeorm';

// import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepo = getCustomRepository(TransactionsRepository);
    const newTransaction = transactionsRepo.create({ title, value, type });
    await transactionsRepo.save(newTransaction);
    return newTransaction;
  }
}

export default CreateTransactionService;
