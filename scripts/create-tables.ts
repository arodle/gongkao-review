import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function checkTables() {
  console.log('🔍 检查 Neon 数据库表...\n');
  
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  
  console.log('现有表:', tables.length > 0 ? tables.map((t: any) => t.table_name).join(', ') : '无');
  
  if (tables.length === 0) {
    console.log('\n📦 开始创建表...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "knowledge_nodes" (
        "id" varchar(36) PRIMARY KEY,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "name" varchar(255) NOT NULL,
        "parent_id" varchar(36),
        "pos_x" integer DEFAULT 0,
        "pos_y" integer DEFAULT 0,
        "ps_score" integer DEFAULT 50 NOT NULL,
        "last_practiced_at" timestamp with time zone,
        "color_tag" varchar(50) DEFAULT 'default',
        "node_type" varchar(20) NOT NULL,
        "content" text,
        "annotation" text,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `;
    console.log('✅ knowledge_nodes 表已创建');

    await sql`
      CREATE TABLE IF NOT EXISTS "practice_records" (
        "id" varchar(36) PRIMARY KEY,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "question_id" varchar(36) NOT NULL,
        "is_correct" boolean NOT NULL,
        "answer_time" integer DEFAULT 0,
        "source_node_ids" jsonb DEFAULT '[]'::jsonb,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `;
    console.log('✅ practice_records 表已创建');

    await sql`
      CREATE TABLE IF NOT EXISTS "ps_history" (
        "id" varchar(36) PRIMARY KEY,
        "node_id" varchar(36) NOT NULL,
        "ps_score" integer NOT NULL,
        "recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user'
      )
    `;
    console.log('✅ ps_history 表已创建');

    await sql`
      CREATE TABLE IF NOT EXISTS "question_bank" (
        "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "question_text" text NOT NULL,
        "option_a" text,
        "option_b" text,
        "option_c" text,
        "option_d" text,
        "correct_answer" varchar(10) NOT NULL,
        "explanation" text,
        "knowledge_path" varchar(500),
        "linked_angle_id" varchar(100),
        "source" varchar(50) NOT NULL DEFAULT 'manual',
        "reference" text,
        "mind_map_id" varchar(36),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ question_bank 表已创建');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "answer_records" (
        "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "question_id" varchar(36) NOT NULL,
        "selected_answer" varchar(10),
        "is_correct" boolean NOT NULL,
        "practice_mode" varchar(20) NOT NULL DEFAULT 'single',
        "practice_set_id" varchar(36),
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ answer_records 表已创建');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "mind_maps" (
        "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "name" varchar(200) NOT NULL DEFAULT '我的思维导图',
        "data" jsonb NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `;
    console.log('✅ mind_maps 表已创建');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "practice_sets" (
        "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" varchar(36) NOT NULL DEFAULT 'default_user',
        "name" varchar(200) NOT NULL,
        "description" text,
        "question_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "mode" varchar(20) NOT NULL DEFAULT 'exam',
        "time_limit" integer,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ practice_sets 表已创建');
    
    await sql`
      CREATE TABLE IF NOT EXISTS "health_check" (
        "id" serial NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now()
      )
    `;
    console.log('✅ health_check 表已创建');
    
    console.log('\n🎉 所有表创建完成！');
  }
  
  const finalTables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log('\n最终表列表:', finalTables.map((t: any) => t.table_name).join(', '));
}

checkTables();
