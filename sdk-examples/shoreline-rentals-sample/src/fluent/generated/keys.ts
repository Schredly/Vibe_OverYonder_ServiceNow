import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    acl_bundle_create: {
                        table: 'sys_security_acl'
                        id: '16adedb246354f46bae81a16a36518c3'
                    }
                    acl_bundle_read: {
                        table: 'sys_security_acl'
                        id: '3be48234b75e42a39b56e6ee461cec29'
                    }
                    acl_bundle_write: {
                        table: 'sys_security_acl'
                        id: 'f013bdff593946939251ab2cea636ecd'
                    }
                    acl_category_create: {
                        table: 'sys_security_acl'
                        id: '73097020760f4d0ab68f96d788baf929'
                    }
                    acl_category_read: {
                        table: 'sys_security_acl'
                        id: 'd9e1ec9a16f74d97b8906c07d471ead1'
                    }
                    acl_category_write: {
                        table: 'sys_security_acl'
                        id: 'ee5854c2135a4912827fa3c2899542c0'
                    }
                    acl_damage_create: {
                        table: 'sys_security_acl'
                        id: 'a6f09f06cb5d4caca301233b8c35d94a'
                    }
                    acl_damage_read: {
                        table: 'sys_security_acl'
                        id: '1def81c413fd4dceb0ac3601a1b82100'
                    }
                    acl_damage_write: {
                        table: 'sys_security_acl'
                        id: '1bf742c10d884cc69b9de2fcb14796be'
                    }
                    acl_equipment_create: {
                        table: 'sys_security_acl'
                        id: '12756f8a22fd45d1a9be4124e59547e8'
                    }
                    acl_equipment_delete: {
                        table: 'sys_security_acl'
                        id: 'eaf46cc8e9bf47a6836d36b1e357e230'
                    }
                    acl_equipment_read: {
                        table: 'sys_security_acl'
                        id: 'e6983879fac24ffab018c37648b14843'
                    }
                    acl_equipment_write: {
                        table: 'sys_security_acl'
                        id: '0adc76bf82b348c3a3eb2d9a57c5ce3c'
                    }
                    acl_lesson_create: {
                        table: 'sys_security_acl'
                        id: 'dd2bb35f07a6469496351b6242a2fb4c'
                    }
                    acl_lesson_read: {
                        table: 'sys_security_acl'
                        id: '74273ca5255644458fb9a8f06ea6029b'
                    }
                    acl_lesson_write: {
                        table: 'sys_security_acl'
                        id: '53eedf59ab1947e884e86663452cc208'
                    }
                    acl_location_create: {
                        table: 'sys_security_acl'
                        id: 'a3a92e9eccc84e41ac23ff21c839e039'
                    }
                    acl_location_read: {
                        table: 'sys_security_acl'
                        id: 'fb027fd1d07c4debb48a209383e16ae9'
                    }
                    acl_location_write: {
                        table: 'sys_security_acl'
                        id: '1228c3046c0c478b8be6f4becb18cf35'
                    }
                    acl_lostfound_create: {
                        table: 'sys_security_acl'
                        id: 'a9a1128a68d44a449d0327c5c93567cc'
                    }
                    acl_lostfound_read: {
                        table: 'sys_security_acl'
                        id: 'bc407b6e89c0433aa41ba2424a8d957e'
                    }
                    acl_lostfound_write: {
                        table: 'sys_security_acl'
                        id: 'ed7b4027c1304cf9a292a45032136c15'
                    }
                    acl_maintenance_create: {
                        table: 'sys_security_acl'
                        id: '855b2519a6f34ff7a5c648aeb6d8b6ad'
                    }
                    acl_maintenance_read: {
                        table: 'sys_security_acl'
                        id: '118cccc58fec4725a207ef8abc6f127f'
                    }
                    acl_maintenance_write: {
                        table: 'sys_security_acl'
                        id: '1040ae775b014a8580221c58813bda20'
                    }
                    acl_membership_create: {
                        table: 'sys_security_acl'
                        id: '9e18b17a3a2641669911830f642c9db0'
                    }
                    acl_membership_read: {
                        table: 'sys_security_acl'
                        id: 'f575263a836c4ee7803eef01f2356d46'
                    }
                    acl_membership_write: {
                        table: 'sys_security_acl'
                        id: '9fe0ded749de4d90a89b2aa84dca3697'
                    }
                    acl_request_create: {
                        table: 'sys_security_acl'
                        id: 'af80af1c15fd45f88bfa14331655df68'
                    }
                    acl_request_delete: {
                        table: 'sys_security_acl'
                        id: 'a3d6596ba5e94ba68726daaf7c5ea9b0'
                    }
                    acl_request_read: {
                        table: 'sys_security_acl'
                        id: '7131951e16a148bbb3be42c33f45c910'
                    }
                    acl_request_write: {
                        table: 'sys_security_acl'
                        id: 'bc482a2a47c3443c9030c9d844f802ed'
                    }
                    acl_request_write_staff: {
                        table: 'sys_security_acl'
                        id: '814366a67b8c4273b683f974a786cf62'
                    }
                    acl_rest_availability: {
                        table: 'sys_security_acl'
                        id: '2446297c552843459929798fb00a769e'
                    }
                    api_availability: {
                        table: 'sys_ws_definition'
                        id: '21c11fab2a7343b5a456312329a59217'
                    }
                    api_availability_get: {
                        table: 'sys_ws_operation'
                        id: 'b765db757283462c98bd9094dbdbe1cb'
                    }
                    app_cat_shoreline: {
                        table: 'sys_app_category'
                        id: '7333df15f60148e383ae344edb4636c5'
                    }
                    app_menu_shoreline: {
                        table: 'sys_app_application'
                        id: '3e9ddfa5794f4abf98a231d539a34b72'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '98e083cb4e4c4050854b0f612e4298d6'
                    }
                    br_damage_propagate: {
                        table: 'sys_script'
                        id: '388a933509664ad7aaef3736268f914a'
                    }
                    br_rental_loyalty: {
                        table: 'sys_script'
                        id: '7d2f9787106c490986a9296d0d25a19d'
                    }
                    br_rental_pricing: {
                        table: 'sys_script'
                        id: '8b9f6ca1a10d4fbbb6f70459c7f43583'
                    }
                    br_rental_reserved: {
                        table: 'sys_script'
                        id: '5639936a8f77414f80155d3bd95cf604'
                    }
                    br_rental_returned: {
                        table: 'sys_script'
                        id: 'e8d16a09435048ce97dfb94e645ad7a0'
                    }
                    bundle_adventure: {
                        table: 'x_1939459_shorelin_bundle'
                        id: '9dfc2bb72f4046428f2569518fa81770'
                    }
                    bundle_family_fun: {
                        table: 'x_1939459_shorelin_bundle'
                        id: '8c0b7ec67b1c458cb9b3cec0e3d527fd'
                    }
                    bundle_kids_adventure: {
                        table: 'x_1939459_shorelin_bundle'
                        id: '653980845b3843c2bde085293427991a'
                    }
                    bundle_romantic: {
                        table: 'x_1939459_shorelin_bundle'
                        id: 'e6127bcd5cbf46f8992a89883cde19ea'
                    }
                    bundle_sunset_chill: {
                        table: 'x_1939459_shorelin_bundle'
                        id: '2deab9e2f6b6405abb01fb9508f89be8'
                    }
                    bundle_surf_session: {
                        table: 'x_1939459_shorelin_bundle'
                        id: '8572dc3b3abf4e4498ba2726febbc49e'
                    }
                    cat_essentials: {
                        table: 'x_1939459_shorelin_category'
                        id: '25a722c5726a4fa494dd73526aefbce9'
                    }
                    cat_evening: {
                        table: 'x_1939459_shorelin_category'
                        id: '6ef1832d84604b52b30b692bfaa42b87'
                    }
                    cat_games: {
                        table: 'x_1939459_shorelin_category'
                        id: '295915345cc543fcbb532e4578923f28'
                    }
                    cat_item_book_lesson: {
                        table: 'sc_cat_item'
                        id: '91e7d6fed76d49709ac8548c38ed3f37'
                    }
                    cat_item_bundle_rental: {
                        table: 'sc_cat_item'
                        id: 'e2a174d7ce504915972cc8ebd594aa18'
                    }
                    cat_item_single_rental: {
                        table: 'sc_cat_item'
                        id: '6b0ccd2e48234838b039235ebe1ad29f'
                    }
                    cat_shade_seating: {
                        table: 'x_1939459_shorelin_category'
                        id: 'f7491ae333544347ac39f02a6cbc4093'
                    }
                    cat_tech: {
                        table: 'x_1939459_shorelin_category'
                        id: '66a3086c71b042eebd965130bf20fe9b'
                    }
                    cat_water_sports: {
                        table: 'x_1939459_shorelin_category'
                        id: 'a105385b7b224452bd016906d7c52498'
                    }
                    cat_wheels: {
                        table: 'x_1939459_shorelin_category'
                        id: '6cb3463ffcf64d55b6fe292dd35eb99d'
                    }
                    cs_rental_request_onload: {
                        table: 'sys_script_client'
                        id: 'bf8c448c34d04b35899d94af461b7293'
                    }
                    eq_baby_tent: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'ce13503e22504efe8640591161b8b9c2'
                    }
                    eq_bonfire_kit: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '4bd3ea5462ed4122bf2a599a9e25f0a3'
                    }
                    eq_boogie_board: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'a0d868ca361349e1b3f73b859f160cf6'
                    }
                    eq_cabana: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '98f155e552f64cc792d18dad3f318afd'
                    }
                    eq_chair_standard: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'c5b0bd4d85a24456a73fd09b244d11f9'
                    }
                    eq_cooler: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '31770c65e77d4928a2aca801287e4d60'
                    }
                    eq_cruiser_bike: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'a41fc7167e964c0cb7c4e552aaee6063'
                    }
                    eq_gopro: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '5c01fc7d39824e01aaebad04b38edd66'
                    }
                    eq_hammock: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '5ec32da7d88b4e93800265255089f0c8'
                    }
                    eq_kayak_double: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '0aec14409b594e688993bfc7786dae3e'
                    }
                    eq_kayak_single: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '1f778c5f49874805b3e66eff1f7f0f16'
                    }
                    eq_kite: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'fb8aa76c83064196bb8c9098103da825'
                    }
                    eq_metal_detector: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '9cf9cfef1f254b80b6a2573e1aa008c6'
                    }
                    eq_sand_toys: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '12bb7e770f4a4e378e52fb6758ccddee'
                    }
                    eq_snorkel_set: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'e4d9994facf54005aed5f44f07632fd5'
                    }
                    eq_speaker: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '17b9c707ac9c478d915dde33048ccad4'
                    }
                    eq_spikeball: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'b05324c00f6b4edfb8897e0d7ab8b25b'
                    }
                    eq_sup: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '168cb4a1825c43b2b4aec5b4f8b6e0f2'
                    }
                    eq_surfboard_foam: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'a74d6861364b49fd91525c84f873ef94'
                    }
                    eq_towel: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '2d4fe772225f4b259fc515f9c8bfa6db'
                    }
                    eq_umbrella_7ft: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'e944d97d80744aecab05bffa151a4dbf'
                    }
                    eq_volleyball: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '0ea07bc4b1a84b17adaa460038f3f2d6'
                    }
                    eq_wagon: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '125bbb5b606b4fdc99d7b4e5173a7ffc'
                    }
                    eq_wetsuit: {
                        table: 'x_1939459_shorelin_equipment'
                        id: '7e58c44ce4574f01bf1e3d23c6b87b0f'
                    }
                    eq_yoga_mat: {
                        table: 'x_1939459_shorelin_equipment'
                        id: 'b22f31c666924e49b03b600cef41a440'
                    }
                    lesson_kayak_tour: {
                        table: 'x_1939459_shorelin_lesson'
                        id: '18b75920f61646a2bbde2395c37e8f4a'
                    }
                    lesson_sandcastle: {
                        table: 'x_1939459_shorelin_lesson'
                        id: '611350e0acf84b3abb1f38a00fee819c'
                    }
                    lesson_snorkel_tour: {
                        table: 'x_1939459_shorelin_lesson'
                        id: '2a20066f1f9d458f8f14f89494f195e6'
                    }
                    lesson_sup_yoga: {
                        table: 'x_1939459_shorelin_lesson'
                        id: '757a2355754843b49bac146f7718883d'
                    }
                    lesson_surf_beginner: {
                        table: 'x_1939459_shorelin_lesson'
                        id: '3f58ad55aa6a4c139b59a80149844850'
                    }
                    loc_hotel_partner: {
                        table: 'x_1939459_shorelin_location'
                        id: '28a22c24abb740049108074dec45ca75'
                    }
                    loc_main_pier: {
                        table: 'x_1939459_shorelin_location'
                        id: '1461935b18bd434ba84797de06a0525b'
                    }
                    loc_north_cove: {
                        table: 'x_1939459_shorelin_location'
                        id: 'c76ea386d9794ad4871ab25db33e61df'
                    }
                    loc_south_jetty: {
                        table: 'x_1939459_shorelin_location'
                        id: '2978dd85174b4a3386719d37caf99e37'
                    }
                    member_demo_beachcomber: {
                        table: 'x_1939459_shorelin_membership'
                        id: 'a093e634b8584255a1f3a88b78b50012'
                    }
                    member_demo_sunchaser: {
                        table: 'x_1939459_shorelin_membership'
                        id: '851e8803dadb4bf89e816fb762bb2ed3'
                    }
                    member_demo_vip: {
                        table: 'x_1939459_shorelin_membership'
                        id: '12c6ded7c12141b0bde04da8a44cc4cc'
                    }
                    mod_active_rentals: {
                        table: 'sys_app_module'
                        id: '973001fcfddb43bebfe5e6a2e96732ac'
                    }
                    mod_all_equipment: {
                        table: 'sys_app_module'
                        id: 'b792f973b9b54924ab6fbbe326f68ea0'
                    }
                    mod_all_rentals: {
                        table: 'sys_app_module'
                        id: '41917097511b48ea9a7fb6e7b2c419bb'
                    }
                    mod_bundles: {
                        table: 'sys_app_module'
                        id: '97ec12ebaa394a9bb09b77fb027c38e7'
                    }
                    mod_categories: {
                        table: 'sys_app_module'
                        id: '7bca98a907e94254a1631b5699635648'
                    }
                    mod_damage_reports: {
                        table: 'sys_app_module'
                        id: '0627cf911df24246a8367f88560e9b49'
                    }
                    mod_featured_equipment: {
                        table: 'sys_app_module'
                        id: 'a36dad1763a34f35869119173a350461'
                    }
                    mod_lessons: {
                        table: 'sys_app_module'
                        id: '8b608597e4d742dabbfc7c8c6c2acb17'
                    }
                    mod_locations: {
                        table: 'sys_app_module'
                        id: '6fc33603564b4e30a2fd308d2f4375c4'
                    }
                    mod_lost_found: {
                        table: 'sys_app_module'
                        id: 'dbf798d24b0a45889aee30f23541defd'
                    }
                    mod_maintenance_log: {
                        table: 'sys_app_module'
                        id: '4378bcedc7e5424c90ff65180cbea4fb'
                    }
                    mod_memberships: {
                        table: 'sys_app_module'
                        id: 'c9d9bc09167d467bad33286d4c59a4d8'
                    }
                    mod_needs_maintenance: {
                        table: 'sys_app_module'
                        id: 'da609098624a48e491d4ce10376bfe88'
                    }
                    mod_new_equipment: {
                        table: 'sys_app_module'
                        id: 'a768122b73174f42acd7cb76c3dfdebc'
                    }
                    mod_new_rental: {
                        table: 'sys_app_module'
                        id: '2dbd8e505c644be3a2b95aeca4aee2b0'
                    }
                    mod_overdue_rentals: {
                        table: 'sys_app_module'
                        id: '205891680a304e3490d49713b97442e3'
                    }
                    mod_separator: {
                        table: 'sys_app_module'
                        id: 'a583a30033e945a3b84ff2d79c0e25b8'
                    }
                    mod_today_rentals: {
                        table: 'sys_app_module'
                        id: 'ca9c158301764787856a28d6a98368a8'
                    }
                    mod_vip_members: {
                        table: 'sys_app_module'
                        id: '77736265fbbf462e94ddbbf2d638eaab'
                    }
                    notif_damage_fee: {
                        table: 'sysevent_email_action'
                        id: '3db5b19c6a98434f94c47cd4057f1bfc'
                    }
                    notif_rental_confirmed: {
                        table: 'sysevent_email_action'
                        id: '536b6664eee8411191db9afc5679733f'
                    }
                    notif_rental_overdue: {
                        table: 'sysevent_email_action'
                        id: 'b1362b8d598244e7b79c10c6b3037efb'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '5844f68b087544308381911f768f4149'
                    }
                    rp_damage_report: {
                        table: 'sc_cat_item_producer'
                        id: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                    }
                    sc_category_shoreline: {
                        table: 'sc_category'
                        id: 'ec4186e362e241209e16e0380e0a63a0'
                    }
                    si_rental_calculator: {
                        table: 'sys_script_include'
                        id: '5c68996e4b9b4353ac72640a8baa8324'
                    }
                    sp_portal_shoreline: {
                        table: 'sp_portal'
                        id: '3cd9dcb9c21045e986dcec1995632e6b'
                    }
                    'src_server_acl-utilities_ts': {
                        table: 'sys_module'
                        id: '6100717c4a94409680de07dbe8764ea3'
                    }
                    'src_server_availability-handler_ts': {
                        table: 'sys_module'
                        id: 'd38de93f3e704ec78ffa558671902ba9'
                    }
                    'src_server_rental-rules_ts': {
                        table: 'sys_module'
                        id: '7dbd04fcb9bf4b7c8d772df4676116e8'
                    }
                    src_server_RentalCalculator_server_js: {
                        table: 'sys_module'
                        id: '232466b18a064054a21b0fbf0f9114c7'
                    }
                    ua_cancel_weather: {
                        table: 'sys_ui_action'
                        id: '1c0239f1e3ba4903844cf9ba21e1aac9'
                    }
                    ua_mark_returned: {
                        table: 'sys_ui_action'
                        id: '1bd90c764e63422ba6ffa4dff48cace3'
                    }
                    ui_policy_waiver_mandatory: {
                        table: 'catalog_ui_policy'
                        id: '8d10b19cf43a42c5be09c4b9e2c5eef3'
                    }
                    varset_customer_contact: {
                        table: 'item_option_new_set'
                        id: '1a14fac30276444494cb2b43ae90cb5c'
                    }
                    widget_shoreline_inventory: {
                        table: 'sp_widget'
                        id: '78ce384a0f5b4ef9846b9d5e8254cd22'
                    }
                }
                composite: [
                    {
                        table: 'sys_documentation'
                        id: '0027353759a64e578be6edd92820b2cb'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimant_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '004e9dc2a5e44a1dba34d29228250cf5'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_on'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0117026660de41eeb6d52a18eee001a5'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            value: 'new'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '014d915debd44fe787acc3114c208f3c'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_at_location'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '01e0b5e6788a4bbf92a6238212ac7c1a'
                        key: {
                            category: 'x_1939459_shorelin_damage_report'
                            prefix: 'DMG'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0292bfad16164477aa8cff55ab11ae05'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '029c1ee7faa84ad09cec2be893703ab8'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '02e9b07c93ef4934aee9d9d3f35035e0'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'hours'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '033cb65a18814b9585ffba9d69e03369'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            value: 'cosmetic'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '034f0039e6084a1da4aa0e48776fc1ea'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'request_notes'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '040661e1f2c649f8a1437199bd5b9405'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'sunset'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '040c77d2d301450e9c8d00482f2e6246'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'included_equipment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '044ef75f526d4fac91ee0cfca48af865'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'sort_order'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0522d01194784ae384bb0ab20886aab9'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'full_day_rate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0579ce58eacf45139d7abcd7726874d9'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'discount_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '060110ab000049f693392621874377f6'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'ritm'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '070ab64b3d8b4b739a243ef9482f04dc'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '074e5eae2657426bb6359872dc087f11'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            value: 'half_day'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '07579bd40483459bb75b14d2c04ea0da'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                            value: 'phone'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '07ea5702ddb64cc49268ef2371568440'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimed_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '08118ed2e70a41dfa211923403d4e50c'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '090d6e1fb075486f81aa5159a372743c'
                        key: {
                            question: {
                                id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                                key: {
                                    cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                                    variable_set: 'NULL'
                                    name: 'severity'
                                }
                            }
                            value: 'cosmetic'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '0ba71910d80449f19a2c12aba336315a'
                        key: {
                            name: 'x_1939459_shorelin_category'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '0bab5162b5f944a7b527f5262b0087b3'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0bce752efaf94e64bf0dee627938cdd8'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'featured'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0bf2df265e904781a84dcbf0924893c7'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'reservation_end'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '0c2f876a571842bda6e7e8be56bcc6a7'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            value: 'retired'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0cff53dc67e84c3694e65e42e4a3e9bb'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0e5eaa916f324bd7be94f0ee4deffc61'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'weather_cancellation'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0e959722c7a34fe182727f456e656446'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'actual_pickup'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '0ea95d6aa5ca4aaab56d851c1aa2fe72'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'fee_waived'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '0eaedb21c8174ed09d9496c80c6cec86'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'image_url'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '10e93768e6ed4452891d35407a49ec26'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'includes_gear'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '10f6d8a868b94a70afd9b495f5aaba98'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'rental_request'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '120ea5a793a94b3398c937179af916e8'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '123457a5ddd946cbaf8e847108a140ac'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '12df383c18324309ab69c2f51263e01f'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '138cd2e9678441d9919f7a4d919ca187'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'tagline'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '13cce40774ad494382b3140db8a865f1'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '152c874170be4c668f36fe6bcf798523'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'lifetime_spend'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '15af811d1e724dbb98abcf45a367a0e9'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'hourly_rate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '1627663fc5424d8db8f21ad3982b7760'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'reservation_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '16545dfcc3894e09b18a35b893d2d970'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '165e4a11a37d4d2da52048f12e3740a8'
                        key: {
                            sys_security_acl: 'e6983879fac24ffab018c37648b14843'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '16638b86f84446568177f0fcbbe2c40b'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'available_quantity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1754c459d69d4a0d939cef0ff487de30'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'reserved'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '183ed06f008a4132bd220aec447a048e'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pickup_location'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '186675b2f7bf437f853d056ce21a7f97'
                        key: {
                            question: {
                                id: 'd970162a0913451db437573333b3b0d3'
                                key: {
                                    cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                                    variable_set: 'NULL'
                                    name: 'format'
                                }
                            }
                            value: 'private'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '18b2c5f7ffa84524a42c56f66f44cb9d'
                        key: {
                            sys_security_acl: 'dd2bb35f07a6469496351b6242a2fb4c'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1a9731d9197d48c585832907e984305d'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_at_location'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1b5d45bd58e34f23a105170df96e2251'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'includes_gear'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1bdff0ce128e4f5f959695419fff96c0'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'total_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1c60008eef2c44688b812720625d0a86'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'description'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '1caaa9ede0ae482e85713aefd149a31d'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'equip_end'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1cb0a9bb5f904770bd80dcdc2744e1ac'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'description'
                        }
                    },
                    {
                        table: 'io_set_item'
                        id: '1dca540caa30491ab432f73b9fe76335'
                        key: {
                            sc_cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '1dffd7ab522e4078b83538bcae58d96b'
                        key: {
                            name: 'x_1939459_shorelin.staff'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1e0f5da274a041f1bdf997199ce4735f'
                        key: {
                            sys_security_acl: '53eedf59ab1947e884e86663452cc208'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '1e2d75748de94c59b0e3b41350ede9a3'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'bundle'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1e4e169ba38941528688a10f596cdb6b'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'party'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '1e9cc5f3f215476780a73cd8341e81be'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'equipment'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1ea2b485e24542f7980d8e0bfda3a065'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'kids'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '1fc8664bba944972b87411dfe0cf8b44'
                        key: {
                            sys_security_acl: '74273ca5255644458fb9a8f06ea6029b'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '201e89d8c86b46a8bca3449580368d33'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2047bbc9212a4a9fb45dd3f40f6d1c68'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            value: 'moderate'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '20b2670e221c464eb7a914e55c01295f'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'full_day_rate'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '22216320bb5d42bdb73efe383b6d179b'
                        key: {
                            category: 'x_1939459_shorelin_maintenance_log'
                            prefix: 'MAINT'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2281ed8f6dd845bd860e2f7d6dbed349'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '22c9372fcd6640168f4c2c6b6079f128'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'group_size_max'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '22d4198b7f004ef5baffc325b8b21d9c'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'joined_on'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '22ee8033508d4993928fceb3f2303de8'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'allows_walkup'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2499f8782e9f4919a042cf3b34dfcd9b'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '24d135868ec4484a8d8eb1394c2c1a2e'
                        key: {
                            sys_security_acl: 'a3d6596ba5e94ba68726daaf7c5ea9b0'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '24f83d942dc14629ac47ed7914587cb1'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'pricing_tier'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '252de281f2814c1fa5410ca6350dabc7'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'joined_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '257ce6b2df6b4bb28e4167a6fe285b4f'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'adventure'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2651ad0d536d4011b2727a61298d111d'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            value: 'minor'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '26d2542fcb664daaa6fc593a697caa8f'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'featured'
                            language: 'en'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '285b3c9019434e17b5195b5f652f5613'
                        key: {
                            question: {
                                id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                                key: {
                                    cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                                    variable_set: 'NULL'
                                    name: 'severity'
                                }
                            }
                            value: 'major'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '2b6f781356964516bfe99544429b2fa6'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'lesson'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2bfe30fd50494d5190082ab27f427aef'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                            value: 'sun_chaser'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '2c470e80aafc421b89ec7fdeb49746a3'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            value: 'new'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2c53068f1f13447db5ac6c933415e304'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'performed_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2c8bd1acda90427980c58e4d524bc684'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'member'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2d2af4cf1bf74ad99d272987f8f183b9'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'address'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '2d588a34b3e8422f9addf1a96c50d695'
                        key: {
                            sys_ui_action: '1c0239f1e3ba4903844cf9ba21e1aac9'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2dbd2164aaf74d43b2be07d37a27475f'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '2e4025c8429848e387dabdff182755de'
                        key: {
                            sys_security_acl: '814366a67b8c4273b683f974a786cf62'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '2fa576de4090487aa891c9e31b9b3f7b'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '30c86d6ec0b34e4ab17e96c01e09c5ed'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'weather_cancellation'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '31841860986e452eb5abd33e4e7ca88a'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '324ff639a0b2493fa31a09f6ff24873f'
                        key: {
                            sys_security_acl: 'd9e1ec9a16f74d97b8906c07d471ead1'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '32b76a5f571d479383d4e4717d4ca92e'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'request_notes'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '330d809a0f3b4915890b149210767212'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'personal'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '330daeecde5f454f8e741f011dafdc97'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'group_size_max'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '33cfa88ed68d4da8b008636416e7fc67'
                        key: {
                            name: 'x_1939459_shorelin_category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '33dcb816eae04e5799e5be83a84a3486'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'discount_percent'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '33de1cd198024df8bc05c6afe3ce1328'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'retire'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '34486e1227f54b3c994f1841da3fcd85'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            value: 'needs_maintenance'
                        }
                    },
                    {
                        table: 'sys_number'
                        id: '348eb65644cf410293eb5788f3517dcf'
                        key: {
                            category: 'x_1939459_shorelin_rental_request'
                            prefix: 'RENT'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3524c8aef8644008bfbe1549ec8eb8e7'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                            value: 'donated'
                        }
                    },
                    {
                        table: 'sys_ui_policy_action'
                        id: '359c03df37b649418afb218310f2f805'
                        key: {
                            ui_policy: {
                                id: 'e783b22076ed4801897606234c52a837'
                                key: {
                                    table: 'x_1939459_shorelin_rental_request'
                                    short_description: 'Shoreline - Weather cancellation waives fees'
                                }
                            }
                            field: 'deposit_amount'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3693695f09d949feb07b3fc598856339'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '38177331d81e4abc944aa2b24e8c25da'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'discount_amount'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '383f3c04e8694617b93667e4b5b107b5'
                        key: {
                            cat_item: 'NULL'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                            name: 'customer_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '38bb6d111c7f4b0c8db5b3a9ccfd74d4'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'list_price'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3973695daf754855add5dd3aeea1b33e'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '3a19f2cc133c45aa8ab1bab6f984f020'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'window_end'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '3b0ceb9522854765a467c7e4288bea43'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3b4f922844ff49f4b6df7f869a6f2cc6'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3b5005ca1543410fb28283fb4384476d'
                        key: {
                            sys_security_acl: '1040ae775b014a8580221c58813bda20'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '3b701077d54c455495018657c9a491f4'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                            value: 'customer'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3b98af44e79f4ee9a65bbf4f16c2fdf7'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3bd2e014f38b461eb4e73569f5c6597c'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'fee_waived_reason'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3bd963cc690d458692efa0ea855cbdf6'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'deposit_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3c21d7c9013d4df1af5ecb4fa26c4098'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'bundle_price'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3c74bcaa698047bcae40739ab865a806'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3d3926bd117b4b61b17eb90f5cd36e85'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'city'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3dc0f4d07c464333b278071843bcbea6'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'price_private'
                            language: 'en'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '3dcd1a2b25a24956a69a4143d381f035'
                        key: {
                            question: {
                                id: '24f83d942dc14629ac47ed7914587cb1'
                                key: {
                                    cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                                    variable_set: 'NULL'
                                    name: 'pricing_tier'
                                }
                            }
                            value: 'weekly'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3dd619a4a3734e63b7f13bdc1bb4855e'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '3e3e7faad42d4b9f9872cfed6ac3fcda'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'location'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '3f30579e9c344d419d709ababe1d8368'
                        key: {
                            sys_security_acl: 'a3a92e9eccc84e41ac23ff21c839e039'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3f865e9ba462455f89299de8cf257169'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'cost'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '400e66cd30f84d8694101089201ef7ab'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_name'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '406356648ed7498aafd176c94e165be7'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'window_start'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '40c5c5bbef6040c2a33f3f61abf6ef44'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '416488cdef974f9296c1bc25b87fa806'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'performed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '41d7431ae48b4955ad03c212b4c2241c'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '427d034da1c648dda36a8642fced28b5'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'performed_by'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '43829f6dfb17444abec47f109053debb'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '43f4d5a82a484ab5a236772b9a46db63'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'occurred_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '44af557bb4364a17b9bcbfb7f635011c'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'waiver_signed'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4504cc378512467983dac60e8acfc31d'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'equipment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '4507caf6813340909f4f3f75ab5d1001'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'kids'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '4515a038981742a9b28b79ec1363f810'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '462e1dc33b4e4cd28d1ec259e6265d58'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '469ea2367dbb4317ab90a9ae3aaf31b5'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'request_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '472dc75cfad34070b688c1906c298639'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '47aa1575a52c4f5bba5355b5aa10165e'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'includes_summary'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '47b7b4b479624f5fa174ede801b2de62'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '4819081ce2514a2baede681cd373d419'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4938ff42c09b4d87a04a4b08ec620522'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'damage_fee'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '4940c7f5de7f4cb0985a4d801581627e'
                        key: {
                            sys_security_acl: '12756f8a22fd45d1a9be4124e59547e8'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '495598f292624c7787a60091435b9841'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'available_quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '49577ffe6b8f4c6faab9035e04ac5bbd'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'incident_notes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4a6748b677cf4adaa96cc6600a18a48d'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4aa791ea6af0477ab7d90d3631e34f1b'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'image_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4b1f4bec6207407f8c8f2aabce008e64'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'hours'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '4b7063ba79714116b015acf8bf54e1ee'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'pickup_location'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '4c457e49d82e410dbc85bcf9fa16f549'
                        key: {
                            question: {
                                id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                                key: {
                                    cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                                    variable_set: 'NULL'
                                    name: 'severity'
                                }
                            }
                            value: 'total_loss'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '4fdeffb227354fd993170714222a9965'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'resolution_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '506674c5a0e343b585959e89e8966952'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'requires_waiver'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '52a8f99ec37c43ea89a7e3e6a74a5663'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'occurred_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '52f5038cc51f49599d55f2817abed324'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'io_set_item'
                        id: '5424e79ca4ab4f099ac46d510d0cf632'
                        key: {
                            sc_cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '553441b22a7b41edaa5b8944fe4f0073'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            value: 'needs_maintenance'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '55352e66c1cf47439e63627d8fb90a12'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '554dddfc205247448a02d67681562ac9'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'romantic'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '556580293d6c4fe39aecfd5b6a4f5f5b'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '558976b95feb427380043e71e22509a9'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '56ae39ba71cf4bac8dd1d2ae9377f10f'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '56afb7712d264b8487826201de3afe7b'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '57bc321ce5574a57aba67d0b816ecf0a'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'latitude'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5aa12dfb9569447a8292e2876a0599ed'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'cleaning'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5ae3b17c1f7d49dc821a5d75506cd7f2'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5b2284dd50544071b4eff9a40ef4d1c4'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'color_hex'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5bb77b543f014807b90b01faee821911'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            value: 'good'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5cd6dc86ac4849b5a91742aa680c08c7'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '5d0269810273489abf50903be5068d2b'
                        key: {
                            sys_security_acl: 'f013bdff593946939251ab2cea636ecd'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '5d0ed5e74f554866832288b3389c8df2'
                        key: {
                            question: {
                                id: '24f83d942dc14629ac47ed7914587cb1'
                                key: {
                                    cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                                    variable_set: 'NULL'
                                    name: 'pricing_tier'
                                }
                            }
                            value: 'hourly'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '5d8826b409314bf4ac7c34adadfdebaf'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'camera'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '5dd5025c4e8c4beea1623fff1a60dc0e'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5f75b60b721c4710b82180863d932ae0'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'paid'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5fb335843a344803b00bff4cfc0f9315'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'member'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '604cd0d102774363b31c969b596251e8'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'window_end'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '612dfffabe7e411ea855584947f330b6'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'snorkel'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '62950d5d66cd4a078cdf93145361474c'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '62f8c06d2f224f7a83716a0bb6b0c878'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '631963f1a3ac43c58b9c19f041baafc8'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'campground'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '637281eddae041cfb2965aedcf262404'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'phone'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '646b6e1301a74c59818b2a73d8faf54f'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'jewelry'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '65dfaceec1184c1aac0987239e94c452'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'photo_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6603fc298a3e43eba32464c9fcab46a5'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'lost'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '674cd97d149146b2b30e790c6ce142d4'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            value: 'retired'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '67d50d9fa50e40ce926921b49f2f09b2'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'found_by'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6849929ad69f45a58f43823262124b40'
                        key: {
                            sys_security_acl: 'bc482a2a47c3443c9030c9d844f802ed'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6862eeeff444480cae3a9292b80e78c3'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'lifetime_spend'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '68eb3e196c6741578075d279a20d2a74'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'fee_waived'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '68eebc7002ed4b0da0e358e413c0f4f8'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '691c976dce7b4230bfdb496f0ea202d1'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '691d7a55382f4f3a978edf2d5323baf0'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '69a7cbec6bf34e47b62291b30ad03f45'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'reservation_end'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '69e6cca947c1475e881e8a8c52405ecd'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'sku'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '6a4c8df0aeaf4d47a976dd317449e729'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'headcount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '6a747c0f36574ea9b628c849c42461fb'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                        }
                    },
                    {
                        table: 'sys_ui_policy_action'
                        id: '6ac474194df1441d8f251eb1d09b840a'
                        key: {
                            ui_policy: {
                                id: 'e783b22076ed4801897606234c52a837'
                                key: {
                                    table: 'x_1939459_shorelin_rental_request'
                                    short_description: 'Shoreline - Weather cancellation waives fees'
                                }
                            }
                            field: 'late_fee'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6ad3411100224f6b975225a0342f8b02'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6c75c09d48434eeaa4fa91017797e232'
                        key: {
                            sys_security_acl: 'f575263a836c4ee7803eef01f2356d46'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '6cb91164047142ab8cc00ffb06f323fc'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'window_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6d8ef0143b864dbc870dfb9ac850c0a4'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_policy'
                        id: '6dc4c8868d3c48bc9ec4887cfb377ba1'
                        key: {
                            table: 'x_1939459_shorelin_rental_request'
                            short_description: 'Shoreline - Late fee required on overdue rentals'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '6e3fa9a3e1534228a3acef4697b30a93'
                        key: {
                            sys_security_acl: '855b2519a6f34ff7a5c648aeb6d8b6ad'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6e54dcbeaafb41c9abc5a706f9ffd1d0'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            value: 'major'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '6f538d8a770a4addb260f1fc66f2212f'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'tire_service'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '6fcf88a20cda44a7bf3aebdb7cd7d591'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '70bbbfd6191a48389273ed853dd57c0f'
                        key: {
                            sys_security_acl: '0adc76bf82b348c3a3eb2d9a57c5ce3c'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7108f902ea0142269d576a876e5ea9ae'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '714ffd2dabe44d0bad145025c97da726'
                        key: {
                            name: 'x_1939459_shorelin_location'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '715b830bf1474c7b8d7100690941782b'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role_contains'
                        id: '71b566c21a154990ab563a2e7fd3f6e4'
                        key: {
                            role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                            contains: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '71ed2bcfb14240228c212a0da6d97711'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '72140d8e18924b3a954862068529e12a'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '724d3bee19f04d9695ebc7131c97f90e'
                        key: {
                            sys_security_acl: 'ee5854c2135a4912827fa3c2899542c0'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '72b24cc5619e4e4cae0f65049ccdbfd9'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                            value: 'claimed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '72de09bd48434ae9afbd31925ddfe361'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_phone'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7373ee0d252e4c74999441cfa6f61cf9'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'sandcastle'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7376b51651a64590929685405f295380'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'performed_at'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '73fdc1c94d534b3b91033e4f81119183'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '74025ef7f98d4ddf8e5f46b389b1a34f'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'loyalty_points'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7555b3bc4d124fb0b51b960f938b8f80'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'bicycle'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '759e148c60d446e8b3ea9459976d3227'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'short_code'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7622709715a745d4b3d79841009a2588'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                            language: 'en'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '76b14144418148ef8b19fe4313caa7df'
                        key: {
                            question: {
                                id: 'd970162a0913451db437573333b3b0d3'
                                key: {
                                    cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                                    variable_set: 'NULL'
                                    name: 'format'
                                }
                            }
                            value: 'group'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '76cb11a35ebc4432bc04474b0e66a442'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '772fded6ad7b4baca7491ee46a473d35'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '78d68a6fd42c4453a631a4fc004715f5'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '796109e0d9a74331820f47b1143a55d1'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'cost'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7a6087e39b254ad0ae21625878ff8c4d'
                        key: {
                            sys_security_acl: '9fe0ded749de4d90a89b2aa84dca3697'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7ab952e1931942909445f5dae30eeded'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7ac07bbf08b44b6d9eb73a026c097505'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7befe05317b645c79ba030304a79e663'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'bundle_price'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7c001fdab22e4f18a3a4933abf04e601'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7c23b6c8281a4f149f35e9f54783034c'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'phone'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7cf3de8daa97489db4f28e2473cb6c80'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'resolution_notes'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '7dbbb661ca984921912a2ff55b34a964'
                        key: {
                            sys_security_acl: '1bf742c10d884cc69b9de2fcb14796be'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7e10ffa55c0a4d22adc48f03614ac51c'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'toys'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7ebf7370faa7490cb6a250264c2956cd'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                            value: 'portal'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7ed5e21707354f0abf3c86e9ba5adf5d'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                        }
                    },
                    {
                        table: 'sys_user_role_contains'
                        id: '7efb91570b8f43099d3842ef91d38d15'
                        key: {
                            role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                            contains: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '7f0b9b611e294909afeaf8f284800a63'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'duration_minutes'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '7f9a58e2220940bc82e73baac55de7d0'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'reservation_end'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '7fa5921698d34580890e1495582f3944'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'surf'
                        }
                    },
                    {
                        table: 'sys_ui_action_role'
                        id: '8072e87a207747e1b6d3f54144725acc'
                        key: {
                            sys_ui_action: '1bd90c764e63422ba6ffa4dff48cace3'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8085750662214517aacf8b281ea7d2f1'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'state'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '80bb5827b18a4514a16cd3f0f7ec62b9'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '80d956c4bd59493ead505000284fbd3e'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'base_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '81ba8ec13fd9472bac083421b97f9162'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '81f7e8ff38f442a5a6f484bb885b92f2'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'includes_summary'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '827caea414ae4be8bcd4019f2ce1015c'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            value: 'bundle'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '82c2a5ce5e3d4daf91a684f3e82a9cd9'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'storage_bin'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '831f1ff4ed59442caaecbbd755ac572c'
                        key: {
                            cat_item: 'NULL'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                            name: 'member_number'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '83fc48ae3ee24903b67c4154733f2db7'
                        key: {
                            sys_security_acl: '2446297c552843459929798fb00a769e'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '8526bd1992c9457eb0d82564c1ef8314'
                        key: {
                            cat_item: 'NULL'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                            name: 'customer_email'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '85805e98ab5849d2a44cdf3c9f172655'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '864d112ad4f147c3b7d8e1fcd7c3003a'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'late_fee'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '871b05106ed7420bbef3e502b576b527'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '87c14c97add34b4cb1f291006f7b45b0'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimant_name'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '889a84e33ef643408dd02f2590cb56ec'
                        key: {
                            sys_security_acl: '118cccc58fec4725a207ef8abc6f127f'
                            sys_user_role: {
                                id: '1dffd7ab522e4078b83538bcae58d96b'
                                key: {
                                    name: 'x_1939459_shorelin.staff'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '88beafdaf6594c72b6403ff72a965660'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'phone'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '89a05d8cdee54b56ad299f749cb90e6f'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89edce92b572416892de0fbdbca617d5'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'wax'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '89f8fcbae8ce4965ac286ce0957ad931'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            value: 'fair'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8a47e5e6c7524f77b118899fc158e460'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8b0cbf67eff043f2aa7937f67ca18761'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                            value: 'none'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8b31f987aede4a829a7e4d5fe85ce2c5'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8b9c77e1cbe04b7ca6390aa45dc80292'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '8bab6c1c647747db8aa39a40f6810366'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8c56e6a6bf27439e91367eb53c8dc7e2'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'equipment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '8c72de908038407e8d4150c4d3525b8d'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'bundle_start'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '8cb5f8ec3daf46c19395d2ab18dc1444'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'window_split'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8e1e77eb252e48768b4c292eef87044a'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_email'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8ee30ea410f74bfbafa5fed73bf90599'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'equipment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '8f89b2af2e5a464a96e24d23ffddbb98'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'actual_return'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8fba79a29a4f43a887646695426f0e32'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'replacement_cost'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '90250f7d190a46bd842e5fae0d887fbb'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'waiver_signed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '904e5865642641e39337718773293321'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'bundle'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '90983fcb24f140beaab81e0701ea94cb'
                        key: {
                            name: 'x_1939459_shorelin.customer'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '90b6fc1d20234e52b91da5f2449d30ba'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'loyalty_points'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '90c7ed050f8d4850ba6f39860d385b35'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'picked_up'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '90e7587bbb064f48b97f94671d90acab'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'reservation_start'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9213bed0db9942e688eaa84ae4e3736a'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9251895377a6400d96945ce46b0a95f5'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'price_per_person'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9304d585294f4c92b51a50889120ddcb'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'discount_percent'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9320c546485e48d9b7bb4209892f7642'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                            value: 'beginner'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9374607ab3ef48af8490ba64c126b9e9'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                            value: 'advanced'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '95072529193145deae237d9a58e8335b'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                            value: 'good'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '95af5170b0174d7cb4662673eb0cf317'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'included_equipment'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '95cfb11e18954d368277aa71b416520f'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'condition_after'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '95f8df50ee4a440e83c3d17286b3f606'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'surf'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '96e288bb2a39402f861a1454eab8b626'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '971de40cbb494f7782cc671cc551426b'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'max_duration_hours'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '98213aef53e9427babd16d5863169a63'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                            value: 'beachcomber'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '999e2d24ba6145b48c6bfd23acafb773'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'total_amount'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '9a071577436b4a579830d11fba60b29f'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'bundle'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9a78acdcd956454782e33ee0793644fb'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'overdue'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '9a7cd5d39cab455eb451ab25b67915bb'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                            value: 'awaiting'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9b6c6c72c0904eec89778eb11ee8ad2f'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'latitude'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c4b3c46068b48438e768a5111304b78'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'hourly_rate'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9c83e3a72aea443e9e11bf33019904f3'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'waiver_on_file'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '9ca62bc9c4ab47c8bf8e6a6d3c0c9f60'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9cc0fa7149894f92b272b5632ac20c9e'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'city'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9d0189fdfe264db3b3cd83156d78b7ea'
                        key: {
                            sys_security_acl: '16adedb246354f46bae81a16a36518c3'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9d90c859cc3d4c60b7c7ad0f68bc8bff'
                        key: {
                            sys_security_acl: '1def81c413fd4dceb0ac3601a1b82100'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9ebe8f048fa2422898b404f61197d5f7'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'total_quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9fc5311ee3684bda839679ab7171c678'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'damage_fee'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a0e95edd76b841d4a3f6ed26f0264bfe'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'expires_on'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: 'a16c5c4345c14b5d9de9640c96e32f96'
                        key: {
                            sc_cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'a173319a5c5d4090aa7a5cd4174157bb'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'quantity'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a17a2cfb57e442fdacaa546bbd7681f8'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a244665bceeb44749458b758e0fab326'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimant_contact'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a2638f2c5af24ad08b02a2192f9047b0'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                            value: 'adult_only'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a2f7cf094cf0496ca8c8d455b58e63b7'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'beach_photography'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a3545ed4bbc04a5cb29a3ed78e873dd4'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'email'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a36cd9c17ad44455938b7544343295da'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'returned'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a3b2c55b618846fdb9370cfb2e90b7b4'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'email'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_index'
                        id: 'a4446f319b5d426a948969b92d8575a4'
                        key: {
                            logical_table_name: 'x_1939459_shorelin_equipment'
                            col_name_string: 'sku'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a46da7c31a54484291afc337a22e0d0d'
                        key: {
                            sys_security_acl: '3be48234b75e42a39b56e6ee461cec29'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a487a989f6e443a5a8f77b4b36032945'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'total_quantity'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'a5d11b77a0ef4f68b5b626c1f1604b2f'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'pickup_location'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'a6221ecd9c554a64b280dc54f34398ae'
                        key: {
                            cat_item: 'NULL'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                            name: 'customer_phone'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a67ea8e0191f462591da57aea0ad406d'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a6b60253e4514837bd338976d27fb34c'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'image_url'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'a733de6f8f224c5790ddece16c8325bd'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                            value: 'partner'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a8042a8cdd814f99a8e0517ac22c71dc'
                        key: {
                            sys_security_acl: 'ed7b4027c1304cf9a292a45032136c15'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a832a24889b24b20970a04bbbcebbcf3'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'half_day_rate'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a89302bc75674e1896c703ed648b7153'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'actual_return'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'a9149cb1478d4a05a734c31fc551afde'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'waiver_signed'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a916e074afab4843a3b516149705242e'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'image_url'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'a982c907d4a14490b4c23972a792cec9'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'incident_notes'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'a98aa5dbf5884df58fae09180c8119c3'
                        key: {
                            sys_security_acl: 'fb027fd1d07c4debb48a209383e16ae9'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a9db4ac37deb43d0bc11479c5e43bbb9'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'deposit_amount'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'aa3645bea6f54d5a8caa23e343b07ee6'
                        key: {
                            question: {
                                id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                                key: {
                                    cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                                    variable_set: 'NULL'
                                    name: 'severity'
                                }
                            }
                            value: 'moderate'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aa702c9317594e0db91e4fef9585afae'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'full_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aa84dab4dbb74caaad5ec7ad8dfd2776'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'phone'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'ab1ac18b840445e2a5fdf9259b210244'
                        key: {
                            sys_security_acl: '1228c3046c0c478b8be6f4becb18cf35'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ab324d9d26ea4b00a85530c46d635bf9'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'longitude'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ab5167ed318c4a29bcb69314f53e1188'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                            value: 'family'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ab9dda7433664d94b7cc7f72ef26c9ba'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'reservation_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ac2b93427d364be69faac34ad2dbb24a'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'rental_request'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ac463bc47c5a4afa99d50b48955f394f'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'kayak_tour'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ace05520327e472285aec11ad44ce6c2'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                            value: 'all_levels'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ad2e358ab2164de9b34c43d78e259032'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ad6d0833ae1b4fcd9388e452719ace34'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'other'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'ae13b81ce8e2433da50e70a9a894ea7d'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'bundle_split'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ae64022a5ded4e27aace9ca1256e421a'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'sup'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'af577c997e47411b893c223c3d7211eb'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'price_per_person'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'af8465095843405ea73b9e5b488be3c1'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'afeaedff4678441796f97ae12ad90666'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimant_contact'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b014c21eada4492c84269b9a6ae0df3b'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b0299dc2d4e247aea120582d4d855213'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'expires_on'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b06f72ae899d48409937494be8f47e30'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'featured'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b09241a61f6e4d6dbda70cab9d98023e'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b0d76bb40c7a434aa76fd11cfb4da8cc'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'equipment'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b0eecc4201f142398b6ecc9805bb3c04'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'severity'
                            value: 'total_loss'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b10d5b9d0420475a916423f0aad0d888'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'savings'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b1c66726cd934c85a8cac03f780a6db2'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b2875797be3e46b387bcadf74c9360ac'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'address'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b333f4cab51f41dc99e0ced47e355d5e'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            value: 'canceled'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b347241a67284d1caa076b91fe70ff3a'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'umbrella-beach'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b373d527153f4372a45e506b55d72e64'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'short_code'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b40918a61bc644b09c95deb2d0b303a8'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'repair'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4612985012d4b60a4beaac01df50f63'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'full_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b47550621d9a4f5984691012f84801cf'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'half_day_rate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'b4b950e84a054421b613310361ec8235'
                        key: {
                            sys_security_acl: 'bc407b6e89c0433aa41ba2424a8d957e'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b6a9431122d241429e98f1587144224d'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                            value: 'walkup'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b6c4a27abba5428eb6ac2688a052043f'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'deposit'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b6cfb27289234af29b53a2f253965259'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'equipment'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b6e1bcb338ed4637b34518fc9aefce6e'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'state'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b73519302c3a45cbaef0d9c7ca12e38d'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'weather_sensitive'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b8025e9ea0b44bf18f250e2ccebe4868'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'claimed_on'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'b81bb6cc0d23407e923de9db02130c33'
                        key: {
                            question: {
                                id: '24f83d942dc14629ac47ed7914587cb1'
                                key: {
                                    cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                                    variable_set: 'NULL'
                                    name: 'pricing_tier'
                                }
                            }
                            value: 'half_day'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'b8d4aca72d1e42cca524edee656af62d'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'bundle_end'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'b8ec76c614df4e189fd1e84846369fd1'
                        key: {
                            question: {
                                id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                                key: {
                                    cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                                    variable_set: 'NULL'
                                    name: 'severity'
                                }
                            }
                            value: 'minor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b993cc0dc16843d6b7f5374ee6c7609c'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b9c0a60874e44e279079c642e8f2ee48'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ba7ed78151f94a7cace64838187f6179'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_email'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bb4ef4e3ac4449b5a6dd62d5d3765d78'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'apparel'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'bc0f6fed12b24511b1f4b3d09b9dd169'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bc82e12745a24ef194f123d66c9fc95e'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bd380db6adf44d30abe2cd76f8eb46e2'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                            value: 'staff'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'bd6a17bb852c4c63b98b46c99a77aae5'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'be89e3c106de4c0db895c5efe3719feb'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'damage_fee'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bec4e763b0034377b5bea64022db667a'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'base_amount'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'bf2f6c01eb254a39aefacc4a7a66f1d9'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'quantity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c0727a3fcd0c482c974fa5340e9a8e77'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c112444e6b0f4d7fbac3d4288d7f70d5'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'equipment'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c12084ec75bc4658b1561ad4b666831e'
                        key: {
                            sys_security_acl: '9e18b17a3a2641669911830f642c9db0'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c123ac464bf4483b81b3ebc8d6ba2945'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'window_split'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: 'c26340fdcbc94c1dac1a84d908d71096'
                        key: {
                            sc_cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'c26d78dfecf74dfa837fb0da4323649d'
                        key: {
                            sys_security_acl: 'a9a1128a68d44a449d0327c5c93567cc'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c2f1ff9568b54afa8e781db82c885bc2'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c3902191ccb14a79832b3a8d9aa3328e'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'sku'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c3f92fbd46034d009ff81e9d9dcdd576'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_ui_policy_action'
                        id: 'c4e5593330e54a1cba5fb03c3f24d246'
                        key: {
                            ui_policy: {
                                id: '6dc4c8868d3c48bc9ec4887cfb377ba1'
                                key: {
                                    table: 'x_1939459_shorelin_rental_request'
                                    short_description: 'Shoreline - Late fee required on overdue rentals'
                                }
                            }
                            field: 'late_fee'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c52f9c15c67440eea65647a5c13a4373'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'preferred_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c67400431fd243f2941f1a64cd181ed1'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'tagline'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c6b3e5e521384a7db0fd390a2920890f'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'color_hex'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c6f8ca49532d408b9a331c17b0a9dc84'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'type'
                            value: 'sup_yoga'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c6fdf574365f44f0bc3884e6a2587f0d'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'paid'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'c866ffff59e348c59f3d763c6c2b6ab6'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'source'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c8dcaaf3fd854de6aed300b7e10335cd'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'duration_minutes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c8ef486a66224d4ba4962785bbb869e1'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'description'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c93ac9c6a80840ce98e81ba1ed334dad'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'severity'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c9a74b036f0e45e888e99cc2af98a020'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'incident_notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c9e5d59dd48840778b6e2951d7199af4'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'equip_split'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'ca435c3ccc47495a8069f5263b30c696'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'rental_request'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'cb17421f3c614e4783a6182aacc376b1'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            value: 'weekly'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cb8da228d1504f15a8afa7b060243a1f'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'weekly_rate'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'cd28ea908fa74f1bb65577f7ff35de68'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'pickup_location'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: 'cdffb0a3849b41ad881160757756def7'
                        key: {
                            sc_cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cede56179e564963840cbbdb21cc59a1'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'location'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd081e86007cc49cd8c5a30ed2faf31fc'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'longitude'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'd0855cf1ec7c4452b748a000d801de48'
                        key: {
                            sys_security_acl: 'af80af1c15fd45f88bfa14331655df68'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd0d0598b05734f44a9d6bbef2f101336'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'late_fee'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'd0e00446e24b4980aa744843e8cef39f'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd20fefece7104ede995d946983d1f275'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'reservation_end'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd24803b446754e6aadc1881c1f89bbb6'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'active'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd266ff961a204c3599050e26f214adaf'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'skill_level'
                            value: 'intermediate'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd2b4df65d5804fb984409f6346677ffc'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'special_requests'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd344630115f143d9916c15d7efa2b364'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd3622ab4c9db492594e6abac7212bcf2'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd3e2d61b3a1c43058225cd3a4082f370'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'reported_by'
                            value: 'partner'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd52e23d5021340139b7c5f07fb64526f'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'tent'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd671583cc6bb44e28b6cda8b56d6d4cf'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'description'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd6d7096caffc4201b4e88ac462d48b8c'
                        key: {
                            cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: 'NULL'
                            name: 'waiver_signed'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd6f103851d9d4e53a61747d5c4e27aac'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'max_duration_hours'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd744a0b82ceb48339e795e4062bf65d7'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'deposit'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'd9190af1d9504347abaa1c6eda3b09c6'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd92c3e3100a14755aa69d58506bd7ecf'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'tier'
                            value: 'wave_rider'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd970162a0913451db437573333b3b0d3'
                        key: {
                            cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            variable_set: 'NULL'
                            name: 'format'
                        }
                    },
                    {
                        table: 'sys_ui_policy_action'
                        id: 'da273e64f88f4c8ca2110f168b34f26c'
                        key: {
                            ui_policy: {
                                id: 'e783b22076ed4801897606234c52a837'
                                key: {
                                    table: 'x_1939459_shorelin_rental_request'
                                    short_description: 'Shoreline - Weather cancellation waives fees'
                                }
                            }
                            field: 'damage_fee'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'db1af0b23cdf438f89cf84ca9b1d8213'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'weather_sensitive'
                            language: 'en'
                        }
                    },
                    {
                        table: 'catalog_ui_policy_action'
                        id: 'db24f92bbf58453e854ed12e4997a43c'
                        key: {
                            ui_policy: '8d10b19cf43a42c5be09c4b9e2c5eef3'
                            catalog_variable: 'IO:a9149cb1478d4a05a734c31fc551afde'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'db5b387b9368427f8c29d70bd30af638'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'weekly_rate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'dbb5699c5b4c4f17a9105a975538f24c'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'reservation_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dc3b83b7df6042cd8314973fb53575de'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'member_number'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'dc3f3093d3144c788d4a44f0e869e24b'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'dcf7a5f56d6e4638b279718016afacf4'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'condition'
                            value: 'fair'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'dd851aa24ed645948e6fa350a7cf08a6'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: 'dd8ea1b7ba8f4c3599863a179a69db80'
                        key: {
                            sc_cat_item: '91e7d6fed76d49709ac8548c38ed3f37'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ddce9bf2584644b88274f19cb8498dca'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'photo_url'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df2f1ccc24244f76979e7043b936c2c1'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            value: 'full_day'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'df7ed6c94dc14bb4a7b7c5bc81286634'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'inspection'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'dfe80fabbc444a7f9de795de43788fec'
                        key: {
                            sys_security_acl: 'eaf46cc8e9bf47a6836d36b1e357e230'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'e1c721fc1ccd4035a8c8331a41d204d8'
                        key: {
                            cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                            variable_set: 'NULL'
                            name: 'equip_start'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e21cf0d4b10546978beef31d769f8343'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'electronics'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e38f580bc8774016af28273257cbe99d'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e3db8357b8fc4801a68a12da2e26978b'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pickup_location'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e40650fc8bc14c2db185aaf99343d84c'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'fee_waived_reason'
                            language: 'en'
                        }
                    },
                    {
                        table: 'io_set_item'
                        id: 'e4d02f7b767640acb51fd11cde7b8f81'
                        key: {
                            sc_cat_item: 'e2a174d7ce504915972cc8ebd594aa18'
                            variable_set: '1a14fac30276444494cb2b43ae90cb5c'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e5237ef913c1400c8ac0c5a133a67387'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                            value: 'disposed'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'e544b8cc60b44d4f9c5cb1db4a57325a'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'equipment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e59acfcee48747869b85117e05453591'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'list_price'
                        }
                    },
                    {
                        table: 'sys_ui_policy'
                        id: 'e783b22076ed4801897606234c52a837'
                        key: {
                            table: 'x_1939459_shorelin_rental_request'
                            short_description: 'Shoreline - Weather cancellation waives fees'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e7eea4cc6cd44e67a156c893a1391efe'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e82b36baa30d4c96803c59fe0a7105cb'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'name'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'e9dca35080ff49598842a5763a68a6dc'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'e9e9742e12a9428297bca5b0b01b3726'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'speaker'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eaa332a0d2434e5982a128c82dc95249'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'sort_order'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'eaf86be69634478e806bb13907b35894'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'short_description'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'eb7ad90cead44c11863de0f602e176b7'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'next_service_due'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ecf857871d474d0bb331b60fa0b34d70'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ed5c2c182e414e658ac821d8c8b700f7'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'customer_phone'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ee18b925f6f44158a2e7c9b55154a9d3'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'featured'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ef2ec6181778459184c62135e3e2bda0'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'ef8a583bed8e404a96c0fd8fa646f27d'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'maintenance_type'
                            value: 'battery'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'efedf24d8e41496ba93b1e490409b907'
                        key: {
                            sys_security_acl: '73097020760f4d0ab68f96d788baf929'
                            sys_user_role: {
                                id: 'f25cb4a5621548d3932281bcc2be3aad'
                                key: {
                                    name: 'x_1939459_shorelin.admin'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f00d2d43e0a041c8947678b405c2bcfa'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f05f272b58a5404790a6ad888e7cf394'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'waiver_on_file'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'f22658e439e247319e8b45801a544a47'
                        key: {
                            sys_security_acl: '7131951e16a148bbb3be42c33f45c910'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f2556cf38d8449e8bfc09d5beb589b47'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'ritm'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'f25c1e683b81499c9c36db89951116f0'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: 'f25cb4a5621548d3932281bcc2be3aad'
                        key: {
                            name: 'x_1939459_shorelin.admin'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f27306985f7d4977aac2016eb0cf8336'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'actual_pickup'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f2e8d8cb9b234b18b151ea0e8947a649'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'savings'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f2f71e4472af491a8984bde19666a463'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'allows_walkup'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f3fa3d2afaf8473e827b36c160891046'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f45fbc46018c4ba4b45d98eecae45fe9'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f4c74937eb21457ebc8fdb4ed6bc58f0'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'pricing_tier'
                            value: 'hourly'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f5d369794f024ac39b4598fc05d032bc'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'replacement_cost'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f7132f9bcefa459e9bf0d8f398caf68f'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'request_notes'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f73a65336ba94d67b9f07218cfc41bbf'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'member_number'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f7b72a872efa4011a966a8d54b81d000'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'active'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f810fe8b7fec419984cde700558f5235'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'description'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f844aed87feb4ab2896c31beabbd0de6'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'age_restriction'
                            value: 'supervised_minor'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f86b771bcf6748f5b3f8e06954e68591'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'storage_bin'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f8992e69f7724408be7d491efd1e68f4'
                        key: {
                            name: 'x_1939459_shorelin_equipment'
                            element: 'requires_waiver'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'f9112205241d4f64af8115ca4a8866dc'
                        key: {
                            name: 'x_1939459_shorelin_location'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'f930679e935c46a7ae9d1909d830a2d6'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'fa3ea7a3c44042f8b0568fd8144506e0'
                        key: {
                            name: 'x_1939459_shorelin_location'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'fa4267742f08471383596fc29b85c335'
                        key: {
                            name: 'x_1939459_shorelin_bundle'
                            element: 'theme'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fa5ea2162a3a483f959c0ad280522021'
                        key: {
                            name: 'x_1939459_shorelin_lost_found'
                            element: 'category'
                            value: 'keys'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'faa4a8397d8f44ba890ed54deb25310e'
                        key: {
                            name: 'x_1939459_shorelin_category'
                            element: 'icon'
                            value: 'surfboard'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fb0b017e04ad4d699025c59fe20371bf'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                            element: 'price_private'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'fbe6fa3b8fb24d57b2b6683aaae66105'
                        key: {
                            question: {
                                id: '24f83d942dc14629ac47ed7914587cb1'
                                key: {
                                    cat_item: '6b0ccd2e48234838b039235ebe1ad29f'
                                    variable_set: 'NULL'
                                    name: 'pricing_tier'
                                }
                            }
                            value: 'full_day'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fc3c9097f40d449bae8e84486aa2ce25'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'damage_fee'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fd43b279fe02439f8273ae5eb1fcb132'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'fd75f04989514b9cb36fe4afe68d577c'
                        key: {
                            name: 'x_1939459_shorelin_lesson'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'fd996f21d42641c4908aecde17270540'
                        key: {
                            cat_item: 'ec311fc551ea4dfba7d1d25f3899c4ff'
                            variable_set: 'NULL'
                            name: 'photo_url'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'fd9e7c746d224f079218aa5f43a45193'
                        key: {
                            name: 'x_1939459_shorelin_membership'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'fe96790f18a54740b438b1aaa6119226'
                        key: {
                            sys_security_acl: 'a6f09f06cb5d4caca301233b8c35d94a'
                            sys_user_role: {
                                id: '90983fcb24f140beaab81e0701ea94cb'
                                key: {
                                    name: 'x_1939459_shorelin.customer'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ff3f0c3681ea4648941cc55a61f54f9e'
                        key: {
                            name: 'x_1939459_shorelin_maintenance_log'
                            element: 'next_service_due'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ffae2835ac554e4394ab22e37d9de975'
                        key: {
                            name: 'x_1939459_shorelin_damage_report'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'fff09d5b4c19463f932f94c20103a2ab'
                        key: {
                            name: 'x_1939459_shorelin_rental_request'
                            element: 'rental_status'
                        }
                    },
                ]
            }
        }
    }
}
