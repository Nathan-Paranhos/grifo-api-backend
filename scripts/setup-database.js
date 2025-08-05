const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.development') });

const setupDatabase = async () => {
  console.log('🚀 Iniciando setup do banco de dados...');
  
  // Configuração do banco
  const config = {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: 'postgres' // Conecta ao banco padrão primeiro
  };

  const client = new Client(config);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao PostgreSQL');
    
    // Criar banco de dados se não existir
    const dbName = process.env.DATABASE_NAME || 'grifo_dev';
    
    try {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Banco de dados '${dbName}' criado`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`ℹ️  Banco de dados '${dbName}' já existe`);
      } else {
        throw error;
      }
    }
    
    await client.end();
    
    // Conectar ao banco específico e executar schema
    const dbClient = new Client({
      ...config,
      database: dbName
    });
    
    await dbClient.connect();
    console.log(`✅ Conectado ao banco '${dbName}'`);
    
    // Ler e executar schema SQL
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await dbClient.query(schemaSql);
    console.log('✅ Schema do banco de dados aplicado com sucesso');
    
    // Setup concluído - banco de dados pronto para produção
    
    await dbClient.end();
    console.log('🎉 Setup do banco de dados concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    console.error('📋 Detalhes do erro:', error);
    console.error('🔍 Stack trace:', error.stack);
    process.exit(1);
  }
};

// Executar setup
setupDatabase();