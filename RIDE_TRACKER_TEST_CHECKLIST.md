# Ride Tracker App — APK Test Checklist

**Prerequisites:**
- Two Android phones (Phone A = Customer, Phone B = Driver)
- Both phones have GPS/location enabled
- Firebase Realtime Database set up with the URL configured in FirebaseDB1
- APK built from MIT App Inventor (Build > Android App .apk) and installed on both phones

**Firebase Setup Reminder:**
1. Go to Firebase Console > your project > Realtime Database
2. Make sure rules are set to test mode (read/write = true)
3. The FirebaseDB1 component's FirebaseURL must be set before exporting

---

## 1. App Launch & UI

- [ ] App opens without crashing
- [ ] Title bar shows "RideTracker"
- [ ] Customer and Driver buttons are visible at the top
- [ ] Customer panel is visible by default (map, inputs, Book Ride button)
- [ ] Driver panel is hidden by default

## 2. Role Switching

- [ ] Tap **Driver** button — Driver panel appears, Customer panel hides
- [ ] Tap **Customer** button — Customer panel appears, Driver panel hides
- [ ] Switching back and forth works without errors

## 3. GPS / Location (test on each phone separately)

- [ ] Location permission prompt appears on first use — grant it
- [ ] **Customer mode:** Location label updates with "Lat: ... Lng: ..." within a few seconds
- [ ] **Driver mode:** Driver location label updates with coordinates
- [ ] Map pans to your current position
- [ ] Your marker moves on the map as you walk/move

## 4. Customer: Book a Ride

**On Phone A (Customer mode):**

- [ ] Tap **Book Ride** with both fields empty — alert says "Enter pickup location"
- [ ] Enter pickup only, tap **Book Ride** — alert says "Enter a destination"
- [ ] Enter both pickup and destination, tap **Book Ride**:
  - [ ] Alert shows "Ride booked!"
  - [ ] Status label changes to "Waiting for driver..."
  - [ ] Book Ride button becomes disabled (greyed out)

**Verify in Firebase Console (Realtime Database > Data):**
- [ ] `ride_pickup` contains the pickup text you entered
- [ ] `ride_dest` contains the destination text you entered
- [ ] `ride_status` = "waiting"

## 5. Driver: Receive & Accept Ride

**On Phone B (Driver mode):**

- [ ] Alert pops up: "New booking!"
- [ ] Booking label changes to "New ride request!"
- [ ] Ride info shows "From: [pickup] To: [destination]"
- [ ] Tap **Accept**:
  - [ ] Alert shows "Ride accepted!"
  - [ ] Driver status changes to "En route to pickup"

**Back on Phone A (Customer mode):**
- [ ] Status updates to "Driver accepted!"
- [ ] Alert shows "Driver is on the way!"

**Verify in Firebase:**
- [ ] `ride_status` = "accepted"

## 6. Driver: Complete Ride

**On Phone B (Driver mode):**

- [ ] Tap **Complete Ride**:
  - [ ] Alert shows "Ride completed!"
  - [ ] Driver status changes to "Available"
  - [ ] Booking label shows "Ride completed!"

**Back on Phone A (Customer mode):**
- [ ] Status updates to "Ride complete!"
- [ ] Book Ride button becomes enabled again

**Verify in Firebase:**
- [ ] `ride_status` = "completed"

## 7. Driver: Reject Ride

**Start a new booking from Phone A, then on Phone B:**

- [ ] Tap **Reject**:
  - [ ] Driver status changes to "Available"
  - [ ] Booking label shows "No bookings"
  - [ ] Ride info clears

**Back on Phone A:**
- [ ] Status updates to "Declined. Try again."
- [ ] Book Ride button becomes enabled again

**Verify in Firebase:**
- [ ] `ride_status` = "rejected"

## 8. Customer: Cancel Ride

**Book a new ride from Phone A, then before the driver acts:**

- [ ] Tap **Cancel Ride**:
  - [ ] Status changes to "Ride cancelled"
  - [ ] Book Ride button becomes enabled again

**On Phone B (Driver mode):**
- [ ] Booking label changes to "Cancelled by customer"
- [ ] Ride info clears
- [ ] Driver status shows "Available"

**Verify in Firebase:**
- [ ] `ride_status` = "cancelled"

## 9. Real-Time Location Sharing

- [ ] On Phone A (Customer), walk or move around — wait ~5 seconds
- [ ] On Phone B (Driver), the customer marker position updates on the map
- [ ] On Phone B (Driver), walk or move around — wait ~5 seconds
- [ ] On Phone A (Customer), the driver marker position updates on the map

**Verify in Firebase:**
- [ ] `cust_lat` and `cust_lng` update as Phone A moves
- [ ] `drv_lat` and `drv_lng` update as Phone B moves

## 10. Full Ride Flow (End-to-End)

Run through the complete sequence without stopping:

1. [ ] Phone A: Enter pickup + destination, tap Book Ride
2. [ ] Phone B: See notification, tap Accept
3. [ ] Phone A: See "Driver accepted!" status
4. [ ] Both phones: Verify markers move as you walk
5. [ ] Phone B: Tap Complete Ride
6. [ ] Phone A: See "Ride complete!", Book Ride re-enabled
7. [ ] Both phones: No crashes, no errors throughout

## 11. Edge Cases

- [ ] Book a ride, switch to Driver mode on the SAME phone — app doesn't crash
- [ ] Rapid-tap Book Ride multiple times — only one booking created
- [ ] Turn off GPS mid-session — app doesn't crash (location just stops updating)
- [ ] Turn GPS back on — location resumes updating
- [ ] Kill and reopen the app — it starts fresh without errors
- [ ] Poor network: if Firebase is slow, app doesn't freeze (alerts may delay)

---

## Results Summary

| Section | Pass | Fail | Notes |
|---------|------|------|-------|
| 1. App Launch & UI | | | |
| 2. Role Switching | | | |
| 3. GPS / Location | | | |
| 4. Customer: Book | | | |
| 5. Driver: Accept | | | |
| 6. Driver: Complete | | | |
| 7. Driver: Reject | | | |
| 8. Customer: Cancel | | | |
| 9. Location Sharing | | | |
| 10. Full E2E Flow | | | |
| 11. Edge Cases | | | |

**Tested by:** _______________
**Date:** _______________
**APK build method:** MIT App Inventor > Build > Android App (.apk)
**Firebase URL:** _______________
**Phones used:** _______________
