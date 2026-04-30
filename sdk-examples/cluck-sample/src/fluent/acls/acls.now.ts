import { Acl } from '@servicenow/sdk/core'
import { cluckAdmin, cluckCustomer, cluckFarmer, cluckFarmhand } from '../roles/roles.now'
import { isSelfOrNew, isStaffOrOwner } from '../../server/acl-utilities'

/**
 * Access control matrix
 *                       | customer | farmhand | farmer | admin |
 *   breed/coop/feed (ref tables)
 *        read           |    Y     |    Y     |   Y    |   Y   |
 *        write/create   |          |          |   Y    |   Y   |
 *   flock               |    Y     |    Y     |   Y    |   Y   |  (read-all; farmer+ CRUD)
 *   bird                |    Y     |    Y     |   Y    |   Y   |  (read-all for adoption showcase)
 *        write          |          |    Y     |   Y    |   Y   |
 *   egg_log             |          |    Y     |   Y    |   Y   |  (farmhand logs daily)
 *   health_record       |          |    Y     |   Y    |   Y   |
 *   incubation          |          |          |   Y    |   Y   |
 *   incident            | own only |    Y     |   Y    |   Y   |  (customer can submit)
 *   order / sub         | own only |    Y     |   Y    |   Y   |
 *   customer            | own only |    Y     |   Y    |   Y   |
 */

// ---------- Breed (read-all, farmer+ CRUD) ----------
Acl({ $id: Now.ID['acl_breed_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_breed' })
Acl({ $id: Now.ID['acl_breed_write'],  type: 'record', operation: 'write',  roles: [cluckFarmer],   table: 'x_1939459_cluck_breed' })
Acl({ $id: Now.ID['acl_breed_create'], type: 'record', operation: 'create', roles: [cluckFarmer],   table: 'x_1939459_cluck_breed' })
Acl({ $id: Now.ID['acl_breed_delete'], type: 'record', operation: 'delete', roles: [cluckAdmin],    table: 'x_1939459_cluck_breed' })

// ---------- Coop ----------
Acl({ $id: Now.ID['acl_coop_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_coop' })
Acl({ $id: Now.ID['acl_coop_write'],  type: 'record', operation: 'write',  roles: [cluckFarmer],   table: 'x_1939459_cluck_coop' })
Acl({ $id: Now.ID['acl_coop_create'], type: 'record', operation: 'create', roles: [cluckAdmin],    table: 'x_1939459_cluck_coop' })

// ---------- Flock ----------
Acl({ $id: Now.ID['acl_flock_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_flock' })
Acl({ $id: Now.ID['acl_flock_write'],  type: 'record', operation: 'write',  roles: [cluckFarmer],   table: 'x_1939459_cluck_flock' })
Acl({ $id: Now.ID['acl_flock_create'], type: 'record', operation: 'create', roles: [cluckFarmer],   table: 'x_1939459_cluck_flock' })

// ---------- Bird (customers can see hens for adoption) ----------
Acl({ $id: Now.ID['acl_bird_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_bird' })
Acl({ $id: Now.ID['acl_bird_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_bird' })
Acl({ $id: Now.ID['acl_bird_create'], type: 'record', operation: 'create', roles: [cluckFarmer],   table: 'x_1939459_cluck_bird' })

// ---------- Feed ----------
Acl({ $id: Now.ID['acl_feed_read'],   type: 'record', operation: 'read',   roles: [cluckFarmhand], table: 'x_1939459_cluck_feed' })
Acl({ $id: Now.ID['acl_feed_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_feed' })
Acl({ $id: Now.ID['acl_feed_create'], type: 'record', operation: 'create', roles: [cluckFarmer],   table: 'x_1939459_cluck_feed' })

// ---------- Egg log ----------
Acl({ $id: Now.ID['acl_egglog_read'],   type: 'record', operation: 'read',   roles: [cluckFarmhand], table: 'x_1939459_cluck_egg_log' })
Acl({ $id: Now.ID['acl_egglog_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_egg_log' })
Acl({ $id: Now.ID['acl_egglog_create'], type: 'record', operation: 'create', roles: [cluckFarmhand], table: 'x_1939459_cluck_egg_log' })

// ---------- Health record (extends task) ----------
Acl({ $id: Now.ID['acl_health_read'],   type: 'record', operation: 'read',   roles: [cluckFarmhand], table: 'x_1939459_cluck_health_record' })
Acl({ $id: Now.ID['acl_health_write'],  type: 'record', operation: 'write',  roles: [cluckFarmer],   table: 'x_1939459_cluck_health_record' })
Acl({ $id: Now.ID['acl_health_create'], type: 'record', operation: 'create', roles: [cluckFarmhand], table: 'x_1939459_cluck_health_record' })

// ---------- Incubation batch ----------
Acl({ $id: Now.ID['acl_incub_read'],   type: 'record', operation: 'read',   roles: [cluckFarmhand], table: 'x_1939459_cluck_incubation' })
Acl({ $id: Now.ID['acl_incub_write'],  type: 'record', operation: 'write',  roles: [cluckFarmer],   table: 'x_1939459_cluck_incubation' })
Acl({ $id: Now.ID['acl_incub_create'], type: 'record', operation: 'create', roles: [cluckFarmer],   table: 'x_1939459_cluck_incubation' })

// ---------- Incident (extends task; customers can report) ----------
Acl({ $id: Now.ID['acl_incident_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_incident', script: isStaffOrOwner })
Acl({ $id: Now.ID['acl_incident_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_incident' })
Acl({ $id: Now.ID['acl_incident_create'], type: 'record', operation: 'create', roles: [cluckCustomer], table: 'x_1939459_cluck_incident' })

// ---------- Order (extends task) ----------
Acl({ $id: Now.ID['acl_order_read'],         type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_order', script: isStaffOrOwner })
Acl({ $id: Now.ID['acl_order_write_self'],   type: 'record', operation: 'write',  roles: [cluckCustomer], table: 'x_1939459_cluck_order', script: isSelfOrNew })
Acl({ $id: Now.ID['acl_order_write_staff'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_order' })
Acl({ $id: Now.ID['acl_order_create'],       type: 'record', operation: 'create', roles: [cluckCustomer], table: 'x_1939459_cluck_order' })

// ---------- Subscription ----------
Acl({ $id: Now.ID['acl_sub_read'],   type: 'record', operation: 'read',   roles: [cluckCustomer], table: 'x_1939459_cluck_subscription', script: isStaffOrOwner })
Acl({ $id: Now.ID['acl_sub_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_subscription' })
Acl({ $id: Now.ID['acl_sub_create'], type: 'record', operation: 'create', roles: [cluckCustomer], table: 'x_1939459_cluck_subscription' })

// ---------- Customer ----------
Acl({ $id: Now.ID['acl_customer_read'],   type: 'record', operation: 'read',   roles: [cluckFarmhand], table: 'x_1939459_cluck_customer' })
Acl({ $id: Now.ID['acl_customer_write'],  type: 'record', operation: 'write',  roles: [cluckFarmhand], table: 'x_1939459_cluck_customer' })
Acl({ $id: Now.ID['acl_customer_create'], type: 'record', operation: 'create', roles: [cluckFarmhand], table: 'x_1939459_cluck_customer' })

// ---------- Scripted REST endpoint (public-ish egg availability) ----------
Acl({
    $id: Now.ID['acl_rest_eggs'],
    name: 'egg_availability',
    type: 'rest_endpoint',
    operation: 'execute',
    roles: [cluckCustomer],
})
