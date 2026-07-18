import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Deterministic org IDs — must match admin-api-server seed and all service migrations
const BOUC_ORG_ID = 'a0000000-0000-4000-8000-000000000001';
const PUBLIC_ORG_ID = 'a0000000-0000-4000-8000-000000000002';

async function seedOrgSubscription(
    orgId: string,
    plan: string,
    price: string,
    label: string
) {
    const existing = await prisma.subscription.findFirst({
        where: { org_id: orgId, status: 'active' },
    });
    if (!existing) {
        const sub = await prisma.subscription.create({
            data: { org_id: orgId, plan, price, status: 'active' },
        });
        console.log(`Subscription created: ${sub.plan} — ${label} (${orgId})`);
    } else {
        console.log(`Subscription already exists: ${existing.plan} — ${label} (${orgId})`);
    }
}

async function main() {
    console.log('Seeding portal database...');

    // Seed org-level active subscriptions for the two default organizations.
    // These are required so the portal returns a valid subscription state from day one
    // for any user whose JWT carries one of these org_id values.
    //
    // Individual user-level billing (invoices, payment methods) is NOT pre-seeded —
    // those records are created through the authenticated API with the correct org/user scope.
    await seedOrgSubscription(BOUC_ORG_ID, 'Internal', '$0.00', 'bouc-io org');
    await seedOrgSubscription(PUBLIC_ORG_ID, 'Free', '$0.00', 'public org');

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
