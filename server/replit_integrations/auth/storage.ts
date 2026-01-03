import { users, type User, type UpsertUser } from "@shared/models/auth";
import { db } from "../../db";
import { eq } from "drizzle-orm";

// Interface for auth storage operations
// (IMPORTANT) These user operations are mandatory for Replit Auth.
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthStorage implements IAuthStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Only update OAuth-related fields to preserve existing app-specific data
    // (role, username, password, position, number, etc.)
    const updateFields: Partial<UpsertUser> = {
      updatedAt: new Date(),
    };
    
    // Only update fields that are actually provided from OAuth claims
    if (userData.email !== undefined) updateFields.email = userData.email;
    if (userData.firstName !== undefined) updateFields.firstName = userData.firstName;
    if (userData.lastName !== undefined) updateFields.lastName = userData.lastName;
    if (userData.profileImageUrl !== undefined) updateFields.profileImageUrl = userData.profileImageUrl;
    
    // Also update name from first/last if available
    if (userData.firstName || userData.lastName) {
      updateFields.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
    }
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        // Set defaults for required fields when creating new OAuth users
        role: userData.role || 'athlete',
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}`.trim() 
          : userData.name || '',
      })
      .onConflictDoUpdate({
        target: users.id,
        set: updateFields,
      })
      .returning();
    return user;
  }
}

export const authStorage = new AuthStorage();
