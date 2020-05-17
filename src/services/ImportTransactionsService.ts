import fs from 'fs';
import csvParse from 'csv-parse';
import { getRepository, In, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransactions {
  title: string;
  type: string;
  value: string;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStrem = fs.createReadStream(filePath);
    const parsers = csvParse({ from_line: 2 });
    const parseCSV = contactsReadStrem.pipe(parsers);

    const transactions: CSVTransactions[] = [];
    const categories: string[] = [];

    // Validate fields
    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      if (!title || !type || !value || !category) return;

      categories.push(category);
      transactions.push({ title, type, value, category });
    });
    await new Promise(resolve => parseCSV.on('end', resolve));

    // Check if exists and create Categories
    const categoryRepo = getRepository(Category);
    const existingCategories = await categoryRepo.find({
      where: { title: In(categories) },
    });
    const existingCategoriesTitles = existingCategories.map(e => e.title);
    const categoryTitlesToAdd = categories
      .filter(e => !existingCategoriesTitles.includes(e))
      .filter((value, index, self) => self.indexOf(value) === index); // remove duplicates

    const newCategories = categoryRepo.create(
      categoryTitlesToAdd.map(title => ({ title })),
    );
    await categoryRepo.save(newCategories);
    const allCategories = [...newCategories, ...existingCategories];

    // Create transactions
    const transactionsRepo = getCustomRepository(TransactionsRepository);
    const createdTransactions = transactionsRepo.create(
      transactions.map(({ title, type, value, category }) => ({
        title,
        type,
        value,
        category: allCategories.find(cat => cat.title === category),
      })) as any,
    );

    await transactionsRepo.save(createdTransactions);
    await fs.promises.unlink(filePath);
    return createdTransactions;
  }
}

export default ImportTransactionsService;
