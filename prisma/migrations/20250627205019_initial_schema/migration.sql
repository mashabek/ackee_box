CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateTable
CREATE TABLE "Box" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "location" geography(Point,4326) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "total_compartments" INTEGER NOT NULL DEFAULT 10,
    "available_compartments" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "Box_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compartments" (
    "id" SERIAL NOT NULL,
    "box_id" TEXT NOT NULL,
    "compartment_number" INTEGER NOT NULL,
    "size" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "compartments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "external_order_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pickup_pin" TEXT,
    "package_size" TEXT NOT NULL DEFAULT 'M',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compartment_reservations" (
    "id" SERIAL NOT NULL,
    "compartment_id" INTEGER NOT NULL,
    "order_id" INTEGER NOT NULL,
    "driver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compartment_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" SERIAL NOT NULL,
    "reservation_id" INTEGER,
    "order_id" INTEGER NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "picked_up_at" TIMESTAMP(3),

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Box_code_key" ON "Box"("code");

-- CreateIndex
CREATE UNIQUE INDEX "compartments_box_id_compartment_number_key" ON "compartments"("box_id", "compartment_number");

-- CreateIndex
CREATE UNIQUE INDEX "orders_external_order_id_key" ON "orders"("external_order_id");

-- AddForeignKey
ALTER TABLE "compartments" ADD CONSTRAINT "compartments_box_id_fkey" FOREIGN KEY ("box_id") REFERENCES "Box"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartment_reservations" ADD CONSTRAINT "compartment_reservations_compartment_id_fkey" FOREIGN KEY ("compartment_id") REFERENCES "compartments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compartment_reservations" ADD CONSTRAINT "compartment_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "compartment_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
