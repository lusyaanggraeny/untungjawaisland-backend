"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingUserType = exports.AdminUserRole = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["OWNER"] = "OWNER";
    UserRole["TOURIST"] = "TOURIST";
})(UserRole || (exports.UserRole = UserRole = {}));
// Corresponds to the user_role ENUM in schema.sql
var AdminUserRole;
(function (AdminUserRole) {
    AdminUserRole["HOMESTAY_OWNER"] = "homestay_owner";
    AdminUserRole["SUPER_ADMIN"] = "super_admin";
    AdminUserRole["ACTIVITY_MANAGER"] = "activity_manager";
})(AdminUserRole || (exports.AdminUserRole = AdminUserRole = {}));
// You might also want types for landing_page_user if you build auth for them
var LandingUserType;
(function (LandingUserType) {
    LandingUserType["USER"] = "user";
    LandingUserType["GUEST"] = "guest";
})(LandingUserType || (exports.LandingUserType = LandingUserType = {}));
