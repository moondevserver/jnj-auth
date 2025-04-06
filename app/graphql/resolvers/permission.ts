import { prisma } from '../../db';
import { checkAuthentication } from '../../utils/auth';
import { Context } from '../../types';

export const permissionResolvers = {
  Query: {
    permissions: async (_: any, __: any, context: Context) => {
      try {
        await checkAuthentication(context);
        
        const permissions = await prisma.permission.findMany({
          orderBy: {
            name: 'asc',
          },
        });
        
        return permissions;
      } catch (error: any) {
        throw new Error(error.message);
      }
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