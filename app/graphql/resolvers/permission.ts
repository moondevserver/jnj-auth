import { prisma } from '../../db';
import { checkAuthentication } from '../../utils/auth';
import { Context } from '../../types';
import { isAdmin } from '../../utils/permissions';

export const permissionResolvers = {
  Query: {
    permissions: async (_: any, { search }: { search?: string }, context: Context) => {
      if (!context.user) {
        throw new Error('인증이 필요합니다.');
      }

      const isUserAdmin = await isAdmin(context.user.id);
      if (!isUserAdmin) {
        throw new Error('접근 권한이 없습니다.');
      }

      const where = search
        ? {
            OR: [
              { code: { contains: search } },
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {};

      return prisma.permission.findMany({
        where,
        orderBy: { code: 'asc' },
      });
    },
    
    permission: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        await checkAuthentication(context);
        
        const permission = await prisma.permission.findUnique({
          where: { id: parseInt(id) },
        });
        
        if (!permission) {
          throw new Error('Permission not found');
        }
        
        return permission;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },
  
  Mutation: {
    createPermission: async (_: any, { input }: { input: any }, context: Context) => {
      try {
        await checkAuthentication(context);
        
        const permission = await prisma.permission.create({
          data: input,
        });
        
        return permission;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    
    updatePermission: async (_: any, { id, input }: { id: string; input: any }, context: Context) => {
      try {
        await checkAuthentication(context);
        
        const permission = await prisma.permission.update({
          where: { id: parseInt(id) },
          data: input,
        });
        
        return permission;
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
    
    deletePermission: async (_: any, { id }: { id: string }, context: Context) => {
      try {
        await checkAuthentication(context);
        
        await prisma.permission.delete({
          where: { id: parseInt(id) },
        });
        
        return {
          success: true,
          message: '권한이 성공적으로 삭제되었습니다.',
        };
      } catch (error: any) {
        throw new Error(error.message);
      }
    },
  },
}; 