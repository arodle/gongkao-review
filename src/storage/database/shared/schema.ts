import { pgTable, serial, varchar, text, timestamp, integer, jsonb, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统表 - 保留不要删除
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 思维导图表（保留兼容，data 为 JSON 快照）
export const mindMaps = pgTable(
	"mind_maps",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		name: varchar("name", { length: 200 }).notNull().default("我的思维导图"),
		data: jsonb("data").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("mind_maps_user_id_idx").on(table.user_id),
	]
);

// 知识点节点表 - 每个知识点一条独立记录
export const knowledgeNodes = pgTable(
	"knowledge_nodes",
	{
		id: varchar("id", { length: 36 }).primaryKey(),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		name: varchar("name", { length: 255 }).notNull(),
		parent_id: varchar("parent_id", { length: 36 }),
		pos_x: integer("pos_x").default(0),
		pos_y: integer("pos_y").default(0),
		ps_score: integer("ps_score").default(50).notNull(),
		last_practiced_at: timestamp("last_practiced_at", { withTimezone: true }),
		color_tag: varchar("color_tag", { length: 50 }).default('default'),
		node_type: varchar("node_type", { length: 20 }).notNull(),
		content: text("content"),
		annotation: text("annotation"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("knowledge_nodes_user_id_idx").on(table.user_id),
		index("knowledge_nodes_parent_id_idx").on(table.parent_id),
		index("knowledge_nodes_node_type_idx").on(table.node_type),
		index("knowledge_nodes_ps_score_idx").on(table.ps_score),
	]
);

// 练习记录表
export const practiceRecords = pgTable(
	"practice_records",
	{
		id: varchar("id", { length: 36 }).primaryKey(),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		question_id: varchar("question_id", { length: 36 }).notNull(),
		is_correct: boolean("is_correct").notNull(),
		answer_time: integer("answer_time").default(0),
		source_node_ids: jsonb("source_node_ids").default(sql`'[]'::jsonb`),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("practice_records_user_id_idx").on(table.user_id),
		index("practice_records_question_id_idx").on(table.question_id),
		index("practice_records_created_at_idx").on(table.created_at),
	]
);

// PS分数历史表
export const psHistory = pgTable(
	"ps_history",
	{
		id: varchar("id", { length: 36 }).primaryKey(),
		node_id: varchar("node_id", { length: 36 }).notNull(),
		ps_score: integer("ps_score").notNull(),
		recorded_at: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
	},
	(table) => [
		index("ps_history_node_id_idx").on(table.node_id),
		index("ps_history_user_id_idx").on(table.user_id),
		index("ps_history_recorded_at_idx").on(table.recorded_at),
	]
);

// 题库表
export const questionBank = pgTable(
	"question_bank",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		question_text: text("question_text").notNull(),
		option_a: text("option_a"),
		option_b: text("option_b"),
		option_c: text("option_c"),
		option_d: text("option_d"),
		correct_answer: varchar("correct_answer", { length: 10 }).notNull(),
		explanation: text("explanation"),
		knowledge_path: varchar("knowledge_path", { length: 500 }),
		linked_angle_id: varchar("linked_angle_id", { length: 100 }),
		source: varchar("source", { length: 50 }).notNull().default("manual"),
		type: varchar("type", { length: 20 }).default("real"),
		reference: varchar("reference", { length: 500 }),
		mind_map_id: varchar("mind_map_id", { length: 36 }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("question_bank_user_id_idx").on(table.user_id),
		index("question_bank_knowledge_path_idx").on(table.knowledge_path),
		index("question_bank_linked_angle_id_idx").on(table.linked_angle_id),
		index("question_bank_source_idx").on(table.source),
	]
);

// 做题记录表（考试记录）
export const answerRecords = pgTable(
	"answer_records",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		question_id: varchar("question_id", { length: 36 }).notNull(),
		selected_answer: varchar("selected_answer", { length: 10 }),
		is_correct: boolean("is_correct").notNull(),
		practice_mode: varchar("practice_mode", { length: 20 }).notNull().default("single"),
		practice_set_id: varchar("practice_set_id", { length: 36 }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("answer_records_user_id_idx").on(table.user_id),
		index("answer_records_question_id_idx").on(table.question_id),
		index("answer_records_practice_set_id_idx").on(table.practice_set_id),
		index("answer_records_created_at_idx").on(table.created_at),
	]
);

// 套卷/练习集表
export const practiceSets = pgTable(
	"practice_sets",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		name: varchar("name", { length: 200 }).notNull(),
		description: text("description"),
		question_ids: jsonb("question_ids").notNull().default(sql`'[]'::jsonb`),
		mode: varchar("mode", { length: 20 }).notNull().default("exam"),
		time_limit: integer("time_limit"),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("practice_sets_user_id_idx").on(table.user_id),
		index("practice_sets_mode_idx").on(table.mode),
	]
);

// 学习笔记表
export const studyNotes = pgTable(
	"study_notes",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().default('default_user'),
		title: varchar("title", { length: 255 }).notNull(),
		content: text("content"),
		linked_node_id: varchar("linked_node_id", { length: 36 }),
		linked_node_name: varchar("linked_node_name", { length: 255 }),
		tags: jsonb("tags").default(sql`'[]'::jsonb`),
		color_tag: varchar("color_tag", { length: 50 }).default('default'),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(table) => [
		index("study_notes_user_id_idx").on(table.user_id),
		index("study_notes_linked_node_id_idx").on(table.linked_node_id),
		index("study_notes_created_at_idx").on(table.created_at),
	]
);
