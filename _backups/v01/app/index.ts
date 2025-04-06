import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import http from 'http';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { authMiddleware } from './middleware/auth';
import { Context } from './types';

// 환경 변수 로드
dotenv.config();

// Express 앱 생성
const app = express();
const httpServer = http.createServer(app);

// CORS 설정
app.use(cors());

// JSON 파싱 미들웨어
app.use(express.json());

// 기본 미들웨어
app.use(authMiddleware);

// Health check 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Apollo Server 설정
const startApolloServer = async () => {
  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production', // 개발 환경에서만 스키마 내부 검사 허용
  });

  // 서버 시작
  await server.start();

  // Apollo 미들웨어 설정
  app.use(
    '/graphql',
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        user: (req as any).user,
        token: (req as any).token,
        req,
        res,
      }),
    })
  );

  // 서버 시작
  const PORT = process.env.PORT || 4001;
  await new Promise<void>((resolve) => {
    httpServer.listen({ port: PORT }, resolve);
  });

  console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
};

// 서버 시작
startApolloServer().catch((err) => {
  console.error('서버 시작 중 오류 발생:', err);
}); 