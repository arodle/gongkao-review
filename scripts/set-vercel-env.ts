// Usage: VERCEL_TOKEN=xxx npx tsx scripts/set-vercel-env.ts
async function main() {
  const TOKEN = process.env.VERCEL_TOKEN;
  if (!TOKEN) {
    console.error('Please set VERCEL_TOKEN environment variable');
    process.exit(1);
  }
  const DB_URL = process.env.DATABASE_URL || (
    console.error('Please set DATABASE_URL environment variable'),
    process.exit(1)
  );

  const projRes = await fetch('https://api.vercel.com/v9/projects/gongkao-review', {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const proj = await projRes.json() as any;
  const projectId = proj.id;
  console.log('Project ID:', projectId);

  const envRes = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=arodle`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: 'DATABASE_URL',
        value: DB_URL as string,
        type: 'encrypted',
        target: ['production'],
      }),
    }
  );
  const envData = await envRes.json() as any;
  console.log('Env result:', envData);
}

main().catch(console.error);
