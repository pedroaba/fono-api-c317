import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
	omit: {
		user: {
			password: true,
		},
	},
	log: ["query", "info", "warn", "error"],
});
