import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    beach_bum_category: {
                        table: 'sys_app_category'
                        id: 'c4259981f98242d88b803fe9628d4305'
                    }
                    beach_bum_menu: {
                        table: 'sys_app_application'
                        id: 'c776044b198349ca9ff6331eeee2a580'
                    }
                    beach_equipment_catalog_item: {
                        table: 'sc_cat_item'
                        id: '0aac66c6e80847d0b8fb84f93172644d'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '34f5e36c08334be09a2e50e8119a6fcb'
                    }
                    br_checkout_created: {
                        table: 'sys_script'
                        id: '99bae355d5ef4846839d9cd36dfd8410'
                    }
                    br_checkout_returned: {
                        table: 'sys_script'
                        id: 'f2823de28e264a408e3db2e2563e235b'
                    }
                    equip_boogie_boards: {
                        table: 'x_beachbum_equipment'
                        id: '9aecfff77ff94282b4951929266b6c18'
                    }
                    equip_chairs: {
                        table: 'x_beachbum_equipment'
                        id: 'a7c18b30950d47b387e639c4f693b7ac'
                    }
                    equip_coolers: {
                        table: 'x_beachbum_equipment'
                        id: 'dde2708f661a48ab942d4903b051b1c9'
                    }
                    equip_snorkel_sets: {
                        table: 'x_beachbum_equipment'
                        id: '23f04cfcadbc4608bf80397b3f981706'
                    }
                    equip_surfboards: {
                        table: 'x_beachbum_equipment'
                        id: '81d5c4f674fd4177ae90efe77833ba57'
                    }
                    equip_towels: {
                        table: 'x_beachbum_equipment'
                        id: '773707191dee40db80258b6ad0c201ee'
                    }
                    equip_umbrellas: {
                        table: 'x_beachbum_equipment'
                        id: '4a43bb2605c54f048f1867e94e4f951d'
                    }
                    module_active_checkouts: {
                        table: 'sys_app_module'
                        id: '7efd2c8753844c8285e46ca83339cbcd'
                    }
                    module_checkout_list: {
                        table: 'sys_app_module'
                        id: '730aba1bb5ba48c29460c8471c8d0cc8'
                    }
                    module_equipment_list: {
                        table: 'sys_app_module'
                        id: '73f24781cc6b44b092b9786579d5b212'
                    }
                    module_new_checkout: {
                        table: 'sys_app_module'
                        id: '9fd47e68a5684238a3b0eacdfafe4395'
                    }
                    module_new_equipment: {
                        table: 'sys_app_module'
                        id: '85215502b8434791b74beb7011bcea6b'
                    }
                    module_overdue_checkouts: {
                        table: 'sys_app_module'
                        id: 'd4fe61a2c17b4b36994e25826bd25f3b'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: '3d378ede22984277a29a8593a21b661e'
                    }
                    'src_server_checkout-rules_ts': {
                        table: 'sys_module'
                        id: '5070eda9e1094d8482a250289966cc7c'
                    }
                }
                composite: [
                    {
                        table: 'question_choice'
                        id: '0088e5a130d74f71aeaa7725f8c3e728'
                        key: {
                            question: {
                                id: '6a91949d1440470d9444efd5d0b27e6a'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'rental_duration'
                                }
                            }
                            value: 'half_day'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '064fffdcc6f948908916c27edf4199b7'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'equipment_type'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '0e18e1226b5b4e2ab44008d757f58f50'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'equipment_start'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '10aab2d9360146238f4d4fcc58a28d92'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '1a7e2e70e7874f2788f87c8f6e870d57'
                        key: {
                            question: {
                                id: '6a91949d1440470d9444efd5d0b27e6a'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'rental_duration'
                                }
                            }
                            value: 'week'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '1b83b40798064c6ba57c2720cde47b84'
                        key: {
                            question: {
                                id: '6a91949d1440470d9444efd5d0b27e6a'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'rental_duration'
                                }
                            }
                            value: 'three_days'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '1c8fbc9431ef49b3946f1c8d0e58fb61'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'umbrella'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '2001e21390f94c47ab9b080ed148ac65'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'umbrella'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '206ffaa95b8043f0b535b55d35335144'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'actual_return'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '23cc712d71084280ac719874296b13b9'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'boogie_board'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '26f20e55db01430f8ecca9d3cddcf4a2'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '2eb9499599524beb826f0c83452f4aa8'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '2fc759af50414d0c9d03cd02f2bd17c8'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'actual_return'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '34cf58fddfd74a9b9e62482553b6ba05'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'checkout_date'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '385e958801b34d43a9f17f17716b744f'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_name'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '385fd1559a994d4dbeba26ba2c6c8ab3'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                            value: 'overdue'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '42a997583a6d4073a64e76244e5f9165'
                        key: {
                            question: {
                                id: '6a91949d1440470d9444efd5d0b27e6a'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'rental_duration'
                                }
                            }
                            value: 'full_day'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '45c7e7fb67ed492ca80e8d7fba031bd9'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '469a0516c9414f828b173bf4570d6943'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'total_quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '4d415285bcaf470282510ae6a266050a'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'total_quantity'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '4d733f878f90464bb345567f1dae7e20'
                        key: {
                            name: 'x_beachbum_equipment'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '526d8945e678409d844cbef6607adee0'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'towel'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '548408ddb6ba46f497a3720a3d849ccf'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            value: 'fair'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '555c1c7c7729422da350e10ba1e4d0b2'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'snorkel_set'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5669144ce76247bbba8d3dba6c6df518'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_email'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '58453c460f5f4ed9bc765038d40fc71c'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_info_end'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '619bf3c85ff342b2bcb9d371e84994bc'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'surfboard'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '65c4bc671a2c45fba877366518b1dde4'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            value: 'new'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '65eca0c184574f26ad1b2e4f5c26c17c'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'equipment'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '6a91949d1440470d9444efd5d0b27e6a'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'rental_duration'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '6c25b3aae639490186a0a4564e45e08f'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '70ae134b3c8c4e0ca4f25880bf6c3920'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'quantity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '70db990bddec42bc9d76c3f9dcc8a84c'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            value: 'poor'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: '7211ffa1d3ef4e2e8b8b6f7f120b4a18'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'snorkel_set'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '780ce1b9d7784a5baaa66aa551750fd9'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '781c0181c8854da59505bc66ff181bc1'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'description'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '7bfa8b744a2047f1bdf497602861bf6f'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_phone'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '7d757f239085486abb44f8b22d2025fd'
                        key: {
                            name: 'x_beachbum_checkout'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: '7dfb8577ce1a4ecf9ff44a3500b11f20'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '7eeb0412f1d2421ea7d3b56fa1b78292'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'notes'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '7f4deb7898ff4371a06db33fcce1975d'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'return_date'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '81fca8446e5248cfadfc395314d234f9'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_info_start'
                        }
                    },
                    {
                        table: 'sc_cat_item_catalog'
                        id: '86ffb7882c974501b2edda114748511f'
                        key: {
                            sc_cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            sc_catalog: 'e0d08b13c3330100c8b837659bba8fb4'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '87e94213fdc0491c82a6ed87920fd8ed'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '89a43ad7c58341c3b6ac98462b808db3'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'expected_return'
                            language: 'en'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: '8aa2220f627e480dbbf2b0ecab3e751e'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_email'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8b909e6c01f346b4b282cc1e84a0e0ab'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'available_quantity'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '8f12f9b62279410ea0ef51bf84daf4e5'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'cooler'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: '92a63e51dd6d4844a2858adc7294c382'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                            value: 'lost'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '9690369750ca4eb4ae64117b65313ecf'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'available_quantity'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '971b1dffc64c464e9e5a932dc14bf47c'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9ecf89dd28b344e4aaa667db6fc1ae4b'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'deposit_collected'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9f66a10c15f14452ad2208d6bb4716ea'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice_set'
                        id: 'a69c4c6ae472489fb311ede7c4a2f75b'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a7681927993d4751ae0208aff7ac2017'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'deposit_collected'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'aa39d6adb3e042beb968992d3fd0f463'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'notes'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'aee5e71d91674906946a89cda9b71e86'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'b31d8610d9724c75a81886af4025cb00'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                            value: 'returned'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: 'b53061b116724f6bbf43a86b5c7625fd'
                        key: {
                            name: 'x_beachbum_equipment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b860c5b9436148c6bbb2801dc375753b'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'checkout_date'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ba02a850ad174c74b09bcd076b7afee5'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_phone'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'bcb7cb185fd3416fa7753836eae537b7'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            value: 'good'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: 'be112d2a1a4e41b6b9c23b107d8d6d8c'
                        key: {
                            name: 'x_beachbum_checkout'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c3af77af6a1c4e10bc6177afa20be43f'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'condition'
                            value: 'retired'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'c3f0fdb7585d4076af88afc5b8554216'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_phone'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'c4b5644daf154c218651de4bd27cf49f'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_email'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'c596e7042a5e46b9b286e0b10a074037'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'rental_date'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'c8044f52661648638f66710793e44b8c'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'towel'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'cc9d52d60e5a47eea5dce05368b19298'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'customer_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ccd9622c08b64f0ea8ad7ed2ded57a46'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'expected_return'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ce2572e3c5ba4647bfbdb137a1fe4870'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'daily_rate'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd1fecd5a4aa04ced950c3e6977658dbd'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'description'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd28db6aa55b94ce8bc2f205d972dde8f'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'surfboard'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'd2b3cbe73f72416094b09164cd4e0cce'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'boogie_board'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'd504fa879964406e972ba6c2cadabe91'
                        key: {
                            question: {
                                id: '6a91949d1440470d9444efd5d0b27e6a'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'rental_duration'
                                }
                            }
                            value: 'two_days'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd55633bf02974f2eaa60b5f22232a95e'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'd556ff4a0335484fbf121597c4b0fb96'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'cooler'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'd79a988b566a462e8b61232c8ac14e6a'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'special_requests'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'd804cd4036054a11b843df0e2a6e4321'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'equipment'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'dc4fa8d024b34bf28fdcf8dfde661503'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'dea478edcab641198a3b4dc04e78677b'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e0231222024149b49b618b5dfccec388'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'question_choice'
                        id: 'e2048cc62a7343cc974cdfd3bdf41d49'
                        key: {
                            question: {
                                id: '064fffdcc6f948908916c27edf4199b7'
                                key: {
                                    cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                                    variable_set: 'NULL'
                                    name: 'equipment_type'
                                }
                            }
                            value: 'chair'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e4e8ad6cb35a447b8196e25365c38b31'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e7c2cef802c2492590fb81dac2b04811'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'quantity'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'f32f1dc995eb4438ad4afb1becd7d2c4'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'type'
                            value: 'chair'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'f6903ea8a7ae41c4a1072b0444b76e37'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'customer_info_split'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'f7dc9fde8c034057993c43a1119dacba'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'equipment_split'
                        }
                    },
                    {
                        table: 'sys_choice'
                        id: 'fb960e7452f74f36adc8a3c1c7a3946e'
                        key: {
                            name: 'x_beachbum_checkout'
                            element: 'status'
                            value: 'checked_out'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'fbb2ca0f3cdc43279405819a81b6f1b9'
                        key: {
                            name: 'x_beachbum_equipment'
                            element: 'daily_rate'
                        }
                    },
                    {
                        table: 'item_option_new'
                        id: 'fbf317c94b144859a4aadb09ef3acdb9'
                        key: {
                            cat_item: '0aac66c6e80847d0b8fb84f93172644d'
                            variable_set: 'NULL'
                            name: 'equipment_end'
                        }
                    },
                ]
            }
        }
    }
}
