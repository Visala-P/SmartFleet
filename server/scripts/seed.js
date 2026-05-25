const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { faker } = require("@faker-js/faker");

const Driver = require("../src/models/Driver");
const Vehicle = require("../src/models/Vehicle");
const Shipment = require("../src/models/Shipment");
const Notification = require("../src/models/Notification");

dotenv.config();

faker.seed(20260523);

const locations = ["Hyderabad", "Chennai", "Bangalore", "Pune", "Mumbai", "Nashik", "Aurangabad", "Vadodara"];
const vehicleTypes = ["Container Truck", "Flatbed", "Light Commercial", "Reefer", "Tanker"];
const statuses = ["Pending", "In Transit", "Delivered", "Delayed"];

const makeDate = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);

  await Promise.all([
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    Shipment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const drivers = await Driver.insertMany(
    Array.from({ length: 8 }).map((_, index) => ({
      employeeId: `DRV-${101 + index}`,
      name: faker.person.fullName(),
      phone: faker.phone.number("+91-##########"),
      licenseNumber: `DL${faker.number.int({ min: 10, max: 99 })}${faker.string.alphanumeric({ length: 6, casing: "upper" })}`,
      availabilityStatus: faker.helpers.arrayElement(["Available", "On Trip", "On Leave"]),
      rating: Number(faker.number.float({ min: 4.3, max: 5, fractionDigits: 1 })),
      completedTrips: faker.number.int({ min: 96, max: 520 }),
      onTimeRate: faker.number.int({ min: 86, max: 99 }),
      safetyScore: faker.number.int({ min: 88, max: 100 }),
    }))
  );

  const vehicles = await Vehicle.insertMany(
    Array.from({ length: 10 }).map((_, index) => {
      const driver = index < drivers.length ? drivers[index] : faker.helpers.arrayElement(drivers);
      return {
        vehicleNumber: `${faker.helpers.arrayElement(["TRK", "VAN", "LCV"])}-${faker.number.int({ min: 200, max: 999 })}`,
        type: faker.helpers.arrayElement(vehicleTypes),
        capacity: faker.number.int({ min: 3500, max: 24000 }),
        driverAssigned: driver._id,
        status: faker.helpers.arrayElement(["Available", "In Transit", "Maintenance", "Inactive"]),
        fuelType: faker.helpers.arrayElement(["Diesel", "CNG", "Electric"]),
        fuelConsumptionKmPerL: Number(faker.number.float({ min: 4.1, max: 9.2, fractionDigits: 1 })),
        insuranceExpiryDate: makeDate(faker.number.int({ min: 20, max: 180 })),
        lastServiceDate: makeDate(-faker.number.int({ min: 5, max: 90 })),
        nextServiceDate: makeDate(faker.number.int({ min: 7, max: 45 })),
      };
    })
  );

  const shipments = await Shipment.insertMany(
    Array.from({ length: 14 }).map((_, index) => {
      const source = faker.helpers.arrayElement(locations);
      const destination = faker.helpers.arrayElement(locations.filter((location) => location !== source));
      const vehicle = faker.helpers.arrayElement(vehicles);
      const driver = faker.helpers.arrayElement(drivers);
      const status = index < 4 ? "In Transit" : faker.helpers.arrayElement(statuses);
      const shipment = {
        shipmentId: `SHP-${1000 + index}`,
        title: `${faker.commerce.productAdjective()} ${faker.commerce.product()} - ${source} to ${destination}`,
        origin: `${source} Warehouse ${faker.number.int({ min: 1, max: 4 })}`,
        destination: `${destination} Hub ${faker.number.int({ min: 1, max: 4 })}`,
        vehicle: vehicle._id,
        driver: driver._id,
        status,
        priority: faker.helpers.arrayElement(["Low", "Medium", "High", "Critical"]),
        weight: faker.number.int({ min: 800, max: 22000 }),
        scheduledPickup: makeDate(-faker.number.int({ min: 1, max: 4 })),
        estimatedDelivery: makeDate(faker.number.int({ min: 1, max: 5 })),
        deliveredAt: status === "Delivered" ? makeDate(-faker.number.int({ min: 1, max: 3 })) : undefined,
        timeline: [
          { label: "Shipment Created", timestamp: makeDate(-faker.number.int({ min: 4, max: 8 })), note: "Created from ERP control tower" },
          { label: "Loaded", timestamp: makeDate(-faker.number.int({ min: 1, max: 4 })), note: "Dock verification completed" },
        ],
      };

      if (status === "Delayed") {
        shipment.timeline.push({ label: "Delay Alert", timestamp: new Date(), note: "Traffic or maintenance impact" });
      }

      return shipment;
    })
  );

  await Driver.findByIdAndUpdate(drivers[0]._id, { assignedTrips: shipments.slice(0, 2).map((item) => item._id) });
  await Driver.findByIdAndUpdate(drivers[1]._id, { assignedTrips: shipments.slice(2, 4).map((item) => item._id) });

  await Notification.insertMany([
    {
      type: "Shipment Delay",
      title: "Critical Shipment Delayed",
      message: `${shipments.find((item) => item.status === "Delayed")?.shipmentId || "SHP-1001"} delayed due to congestion. ETA updated.`,
      audienceRoles: ["admin", "transport_manager", "warehouse_staff"],
    },
    {
      type: "Maintenance",
      title: "Maintenance Due",
      message: `${vehicles[0].vehicleNumber} due for service within 3 days.`,
      audienceRoles: ["admin", "transport_manager"],
    },
    {
      type: "Task",
      title: "Dock Allocation Pending",
      message: `${shipments[1].shipmentId} waiting for dock assignment before shift end.`,
      audienceRoles: ["warehouse_staff", "transport_manager"],
    },
    {
      type: "Info",
      title: "Delivery Completed",
      message: `${shipments[0].shipmentId} completed and closed in the operations console.`,
      audienceRoles: ["admin", "transport_manager"],
    },
  ]);

  console.log("Seed completed.");
  console.log(`Created ${drivers.length} drivers, ${vehicles.length} vehicles, ${shipments.length} shipments.`);

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
