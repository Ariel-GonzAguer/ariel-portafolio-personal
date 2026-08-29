const { INTERNAL_runFetch } = await import('../dist/server/index.js');

export default async (request, context) => INTERNAL_runFetch(process.env, request, { context });

export const config = {
  preferStatic: true,
  path: ['/', '/*', '/RSC/**/*'],
};
