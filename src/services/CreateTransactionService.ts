import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
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
    // Check balance
    const transactionsRepo = getCustomRepository(TransactionsRepository);
    const { total } = await transactionsRepo.getBalance();
    if (type === 'outcome' && total < value) {
      throw new AppError('Insufficient funds.');
    }

    // Check category
    const categoryRepo = getRepository(Category);
    let transactionCategory = await categoryRepo.findOne({
      where: { title: category },
    });
    if (!transactionCategory) {
      transactionCategory = categoryRepo.create({ title: category });
      await categoryRepo.save(transactionCategory);
    }

    const newTransaction = transactionsRepo.create({
      title,
      value,
      type,
      category: transactionCategory,
    });
    await transactionsRepo.save(newTransaction);
    return newTransaction;
  }
}

export default CreateTransactionService;
