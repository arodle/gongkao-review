import { relations } from "drizzle-orm/relations";
import { healthCheck, mindMaps, questionBank, answerRecords, practiceSets } from "./schema";

export const healthCheckRelations = relations(healthCheck, () => ({}));

export const mindMapsRelations = relations(mindMaps, () => ({}));

export const questionBankRelations = relations(questionBank, () => ({}));

export const answerRecordsRelations = relations(answerRecords, ({ one }) => ({
  question: one(questionBank, {
    fields: [answerRecords.question_id],
    references: [questionBank.id],
  }),
}));

export const practiceSetsRelations = relations(practiceSets, () => ({}));
