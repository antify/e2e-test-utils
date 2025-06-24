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
	 * Cookies with permissions to create, read, update and delete entries
	 */
	cookieValueWithPermissions: Record<string, string>

	/**
	 * Cookies with no permissions
	 */
	cookieValueWithoutPermissions: Record<string, string>
}
