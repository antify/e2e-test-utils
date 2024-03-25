import {CrudAction} from "./utils";

/**
 * Describes what Crud actions are allowed for the given entry.
 * An undefined value means that the action is allowed.
 *
 * @example A user entry is not create able because new user entries get created by invites and not by a "Create" button.
 * Therefore, following config is required:
 * {
 *   canCreate: false
 * }
 *
 * The invite process is needed to implement by the developer.
 */
export type CrudActionsConfig = { [key in CrudAction]?: boolean }

export type AuthConfig = {
	/**
	 * Key of the cookie which contains the jwt token
	 */
	tokenCookieKey: string

	/**
	 * Valid jwt token with permissions to create, read, update and delete entries
	 */
	validJwtWithCrudPermissions: string

	/**
	 * Valid jwt token with no permissions
	 */
	validJwtWithoutCrudPermissions: string
}
