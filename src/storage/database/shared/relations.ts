import { relations } from "drizzle-orm/relations";
import { healthCheck, mindMaps, knowledgeNodes, practiceRecords, psHistory, questionBank, answerRecords, practiceSets } from "./schema";

export const healthCheckRelations = relations(healthCheck, () => ({}));

export const mindMapsRelations = relations(mindMaps, () => ({}));

export const knowledgeNodesRelations = relations(knowledgeNodes, ({ one, many }) => ({
  parent: one(knowledgeNodes, {
    fields: [knowledgeNodes.parent_id],
    references: [knowledgeNodes.id],
    relationName: "node_children",
  }),
  children: many(knowledgeNodes, { relationName: "node_children" }),
  practiceRecords: many(practiceRecords),
  psHistory: many(psHistory),
}));

export const practiceRecordsRelations = relations(practiceRecords, ({ one }) => ({
  question: one(questionBank, {
    fields: [practiceRecords.question_id],
    references: [questionBank.id],
  }),
}));

export const psHistoryRelations = relations(psHistory, ({ one }) => ({
  node: one(knowledgeNodes, {
    fields: [psHistory.node_id],
    references: [knowledgeNodes.id],
  }),
}));

export const questionBankRelations = relations(questionBank, ({ many }) => ({
  practiceRecords: many(practiceRecords),
  answerRecords: many(answerRecords),
}));

export const answerRecordsRelations = relations(answerRecords, ({ one }) => ({
  question: one(questionBank, {
    fields: [answerRecords.question_id],
    references: [questionBank.id],
  }),
}));

export const practiceSetsRelations = relations(practiceSets, () => ({}));
