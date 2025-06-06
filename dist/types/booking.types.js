"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HousekeepingStatus = exports.BookingStatus = void 0;
var BookingStatus;
(function (BookingStatus) {
    BookingStatus["PENDING"] = "pending";
    BookingStatus["CONFIRMED"] = "confirmed";
    BookingStatus["CANCELLED"] = "cancelled";
    BookingStatus["COMPLETED"] = "completed";
})(BookingStatus || (exports.BookingStatus = BookingStatus = {}));
var HousekeepingStatus;
(function (HousekeepingStatus) {
    HousekeepingStatus["PENDING"] = "pending";
    HousekeepingStatus["IN_PROGRESS"] = "in_progress";
    HousekeepingStatus["COMPLETED"] = "completed";
})(HousekeepingStatus || (exports.HousekeepingStatus = HousekeepingStatus = {}));
