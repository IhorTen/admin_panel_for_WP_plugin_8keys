(function( $ ) {

    if ($('.kys_plugin_error').length) {
        $('#wpbody').prepend(`
            <div class="bg_error"></div>
            <div class="pop_up_error" >
                <p class="pop_up_error_text mx-2">${$('input').find('.kys_plugin_error').prevObject[2].value}</p>
            </div>
        `)
    }

    $('form').on('submit', function (e) {
        e.preventDefault();
    });

    let is_cheapest = '/cheapest';
    var is_test = '';
    var _8keysApiUrl = `https://phplaravel-269850-845247.cloudwaysapps.com/v1.0`;
    let id_list = [];
    // let ready_to_upload = [];
    let added_items = [];
    let downloaded_products = $('.product_list');
    const chosen_products =  $('.chosen_products');
    const spinner = document.getElementById('spinner_loading');
    const imported_btn_items = $('.imported_items');
    const mobile_body_navigation = $('.mobile_body_nav');
    let spinner_pagination = document.getElementById('spinner_pagination');
    let pageElemAmount = 15;

    tidioActivate();

    checkAuthorization();

    setInputFilter(document.getElementById("input_search"), function(value) {
        let regex_num;
        (value[0] !== "#") ? regex_num =/^[a-zA-Z0-9!@#$%&()-`.+,\s/]*$/ : regex_num =  /^[#]?[0-9]*$/;
        return regex_num.test(value);
    });

    loginUser();

    isBestPriceActive();

    mobileItemsToggle();

    activeMenuItem();

    startSearch();

    removeItem();

    seeMoreItemInfo();

    function checkAuthorization() {
        if (!$('.user_login').val()){
            nonLogged();
        } else {
            if ($('.user_login').val().length !== 32){
                $('.auth_check').html('Wrong API-Key');
                nonLogged();
            } else {
                console.log(`${_8keysApiUrl}/user`);
                fetch(`${_8keysApiUrl}/user`, {
                    method: 'GET',
                    headers: {
                        'Keys-Api-Auth': $('.user_login').val()
                    },
                })
                    .then(response => response.json())
                    .then(user_data => {
                        // console.log('Checking...');
                        if (!user_data.id) {
                            // console.log('CHECK FAILED');
                            nonLogged();
                            $('.auth_check').html('Wrong API-Key')
                        } else {
                            // console.log('CHECK SUCCESS');
                            Logged(user_data.first_name, user_data.last_name, user_data.balance, user_data.currency, $('.user_login').val());
                        }
                    })
            }
        }
    }

    function loginUser() {
        $('.update_key_button').on('click', function () {
            console.log(`${_8keysApiUrl}/user`);
            fetch(`${_8keysApiUrl}/user`, {
                method: 'GET',
                headers: {
                    'Keys-Api-Auth': $('.user_login').val()
                },
            })
                .then(response => response.json())
                .then(user_data => {
                    console.log(user_data);
                    if (!user_data){
                        // console.log('no data');
                        $('.auth_check').html('Error, please reload page or check connection')
                    } else {
                        if (user_data.error){
                            // console.log("ERROR: " + user_data.error);
                            // nonLogged();
                            $('.auth_check').html(user_data.error)
                        } else {
                            Object.keys(user_data).forEach( key => {
                                let new_key = plugin_key + '_' + key;
                                user_data[new_key] = user_data[key];
                                delete user_data[key];
                            });
                            user_data['action'] = 'kys_set_user_info';
                            user_data[plugin_key + '_auth_key'] = $('.user_login').val();
                            $('.auth_check').html('');
                            // Logged(user_data.kys_first_name, user_data.kys_last_name);
                            $.ajax({
                                url:ajaxurl,
                                data: user_data,
                                method: "POST",
                                success: function (data_info) {
                                    console.log(data_info);
                                    if (data_info.success){
                                        // console.log('Auth success:', data_info.success);
                                        Logged(user_data.kys_first_name, user_data.kys_last_name, user_data.kys_balance, user_data.kys_currency);
                                        // $('.user_login').val(user_data.kys_auth_key);
                                    } else {
                                        // console.log('Auth faild ', data_info.error);
                                        $('.auth_check').html('Wrong API-Key');
                                        nonLogged();
                                    }
                                },
                                error: function (error) {
                                    console.log(error)
                                }
                            });
                        }
                    }
                })
        });
    }

    function nonLogged() {
        $('#wpbody').addClass('non_logged');

        $('.logged_name').html('not logged');
        $('.update_key_button').html('log in');
        $('.logged_us_body').html('Not Logged');
        $('.balance_value').html(0);
        $('.currency_symbol').html('');

        $('.elements_item').removeClass('active_menu_item').addClass('hover');
        $('.user_item').removeClass('hover').addClass('active_menu_item');
        $('.mob_elements').removeClass('active_mob_menuItem active').addClass('hover_mobile');
        $('.mob_user').removeClass('hover_mobile').addClass('active_mob_menuItem active');
        $('#el-body').removeClass('active');
        $('#us-body').addClass('active');

        $('.test_plugin').on('click', function () {
            $('.elements_item').addClass('active_menu_item').removeClass('hover');
            $('.user_item').addClass('hover').removeClass('active_menu_item');
            $('.mob_elements').removeClass('hover_mobile').addClass('active_mob_menuItem active');
            $('.mob_user').removeClass('active_mob_menuItem active').addClass('hover_mobile');
            $('[href="#el-body"]').tab('show');
        });

        $('.continue_testing').on('click', function () {
            $('.bg_pop_up_elements_nl, .pop_up_elements_nl').hide();
        });

        $('.pop_up_nl_log_in').on('click', function () {
            $('.user_item').addClass('active_menu_item').removeClass('hover');
            $('.elements_item').addClass('hover').removeClass('active_menu_item');
            $('.mob_user').addClass('active_mob_menuItem active').removeClass('hover_mobile');
            $('.mob_elements').addClass('hover_mobile').removeClass('active_mob_menuItem active');
            $('[href="#us-body"]').tab('show');
        });

        $('.check_authorization').hide();
    }

    function Logged(first_name, last_name, balance, currency, api_key) {
        $('.product_list').empty();

        if (api_key){
            $('.bg_pop_up_elements, .pop_up_elements').hide();
        } else {
            $('.bg_pop_up_elements, .pop_up_elements').show();
            $('.bg_pop_up_elements, .pop_up_ok').on('click', function () {
                $('.bg_pop_up_elements, .pop_up_elements').hide();
            });
        }

        $('#wpbody').removeClass('non_logged');
        $('.logged_name').html(first_name + ' ' + last_name);
        $('.logged_us_body').html('Logged as ' + first_name + ' ' + last_name);
        $('.update_key_button').html('update key');
        $('.balance_value').html(balance);
        $('.currency_symbol').html(currency);

        $('.elements_item').removeClass('hover').addClass('active_menu_item');
        $('.user_item').removeClass('active_menu_item').addClass('hover');
        $('.mob_elements').removeClass('hover_mobile').addClass('active_mob_menuItem active');
        $('.mob_user').removeClass('active_mob_menuItem active').addClass('hover_mobile');
        $('#el-body').addClass('active');
        $('#us-body').removeClass('active');
        $('[href="#el-body"]').tab('show');

        requestAllCheapestElements();
    }

    function activeMenuItem() {
        $('.panel_item ').on('click', function(){
            $(this).addClass('active_menu_item').removeClass('hover');
            $(this).parent().children('li').not(this).removeClass('active_menu_item').addClass('hover');
        });

        $('.mob_link').on('click', function () {
            $(this).addClass('active_mob_menuItem').removeClass('hover_mobile');
            $(this).parent().children('li').not(this).removeClass('active_mob_menuItem').addClass('hover_mobile');
        });

        $('.check_authorization').hide()
    }

    function requestAllCheapestElements() {

        let detect_request_all = false;
        let curr_page_all = 2;

        console.log(`${_8keysApiUrl}${is_cheapest}/items/all`);
        fetch(`${_8keysApiUrl}${is_cheapest}/items/all`,{
            method: 'GET',
            headers: {
                'Keys-Api-Auth': $('.user_login').val()
            },
        })
            .then(response => response.json())
            .then(data => {
                // console.log(data);
                data.forEach(elem => {
                    showItems(elem);
                });

                findDuplicateItems(data);
                addItemHandler(data);
                spinner.setAttribute('hidden', '');
                imported_btn_items.removeAttr('hidden');
                $('.ch_pr_text').removeAttr('hidden');
                // mobile_body_navigation.removeAttr('hidden');
                mobile_body_navigation.removeClass('d-none').addClass('d-md-flex d-lg-none');

            });
        // .then();

        window.onscroll = function() {
            if ((window.innerHeight + window.pageYOffset) >= document.getElementById('wpwrap').offsetHeight && !detect_request_all) {
                spinner_pagination.removeAttribute('hidden');
                console.log(`${_8keysApiUrl}${is_cheapest}/items/all`);
                $.ajax({
                    url: `${_8keysApiUrl}${is_cheapest}/items/all`,
                    type: "GET",
                    headers: {
                        'Keys-Api-Auth': $('.user_login').val()
                    },
                    data: {
                        page: curr_page_all,
                    },
                    beforeSend: function() {
                        detect_request_all = true
                    },
                    success: function (data) {
                        if (data.length === 0){
                            noMoreElementsFound ();
                            detect_request_all = true;
                            spinner_pagination.setAttribute('hidden', '');
                        } else {
                            spinner_pagination.setAttribute('hidden', '');
                            data.forEach(elem => {showItems(elem)});
                            findDuplicateItems(data);
                            // let addItem = addItemHandler;
                            addItemHandler(data);
                            // addItem(data);
                            detect_request_all = false;
                            curr_page_all += 1;

                        }
                    },
                    error: function (error) {
                        console.error(error);
                        spinner_pagination.setAttribute('hidden', '');
                    }
                });
            }
        }

        // window.onscroll = function() {
        //     if ((window.innerHeight + window.pageYOffset) >= document.getElementById('wpwrap').offsetHeight && !detect_request_all) {
        //         spinner_pagination.removeAttribute('hidden');
        //         $.ajax({
        //             url: `https://phplaravel-269850-845247.cloudwaysapps.com/v1.0/cheapest/items/all`,
        //             type: "GET",
        //             headers: {
        //                 'Keys-Api-Auth': $('.user_login').val()
        //             },
        //             data: {
        //                 page: curr_page_all,
        //             },
        //             beforeSend: function() {
        //                 detect_request_all = true
        //             },
        //             success: function (data) {
        //                 if (data.length === 0){
        //                     noMoreElementsFound ();
        //                     detect_request_all = true;
        //                     spinner_pagination.setAttribute('hidden', '');
        //                 } else {
        //                     spinner_pagination.setAttribute('hidden', '');
        //                     data.forEach(elem => {showItems(elem)});
        //                     findDuplicateItems(data);
        //                     addItemHandler(data);
        //                     detect_request_all = false;
        //                     curr_page_all += 1
        //                 }
        //             },
        //             error: function (error) {
        //                 console.error(error);
        //                 spinner_pagination.setAttribute('hidden', '');
        //             }
        //         });
        //     }
        // };

    }

    function startSearch() {
        $('.search_button').on('click', function () {
            searchItems();
        });

        $('.search_input').on('keyup', function (event ) {
            event.preventDefault();
            if (event.keyCode === 13) {
                searchItems();
            }
        });
    }

    function searchItems() {
        let keywords = $('.search_input').val();
        let detect_request = false;
        let curr_page = 2;

        if($('.checkbox_cheapest').is(':checked')){
            is_cheapest = '/cheapest';
        } else {
            is_cheapest = '';
        }

        if ($('#wpbody').hasClass('non_logged')) {
            is_test="_test";
            is_cheapest = '';
        } else {
            is_test="";
        }

        // $('#wpbody').hasClass('non_logged') ? is_test="_test": is_test="";

        if (keywords.length === 0) {
            $('.search_input').attr('placeholder', 'Type a correct value');
        } else {
            $('.product_list').empty();
            $('.product_list').append(`<div class="check_items"><div class="lds-ripple spinner_loading_items"><div></div><div></div></div></div>`);
            if (keywords[0] === "#"){
                if (keywords.length > 1){
                    spinner.removeAttribute('hidden');
                    keywords = keywords.substring(1);
                    console.log(`${_8keysApiUrl}${is_test}${is_cheapest}/item/${keywords}`);
                    fetch(`${_8keysApiUrl}${is_test}${is_cheapest}/item/${keywords}`, {
                        method: 'GET',
                        headers: {
                            'Keys-Api-Auth': $('.user_login').val()
                        },
                    })
                        .then(response => response.json())
                        .then(data => {
                            $('.product_list').empty();
                            // console.log('server data', data);
                            showItems(data);
                            findDuplicateItems(data);
                            addItemHandler(data);
                            spinner.setAttribute('hidden', '');
                            imported_btn_items.removeAttr('hidden');
                            $('.ch_pr_text').removeAttr('hidden');
                            mobile_body_navigation.removeClass('d-none').addClass('d-md-flex d-lg-none');
                            window.onscroll = function() {
                                return false
                            }
                        });
                } else {
                    noData ();
                    $('.product_list .check_items').hide();
                }
            } else {
                spinner.removeAttribute('hidden');
                console.log(`${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}`);
                fetch(`${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}?amount=${pageElemAmount}`, {
                    method: 'GET',
                    headers: {
                        'Keys-Api-Auth': $('.user_login').val()
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        // console.log(data);
                        (data.length === 0) ? noData () :
                            data.forEach(elem => {
                                showItems(elem);
                            });
                        findDuplicateItems(data);
                        addItemHandler(data);
                        spinner.setAttribute('hidden', '');
                        imported_btn_items.removeAttr('hidden');
                        $('.ch_pr_text').removeAttr('hidden');
                        mobile_body_navigation.removeClass('d-none').addClass('d-md-flex d-lg-none');
                    });
                window.onscroll = function() {
                    if ((window.innerHeight + window.pageYOffset) >= document.getElementById('wpwrap').offsetHeight && !detect_request) {
                        spinner_pagination.removeAttribute('hidden');
                        console.log(`${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}`);
                        $.ajax({
                            url: `${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}`,
                            type: "GET",
                            headers: {
                                'Keys-Api-Auth': $('.user_login').val()
                            },
                            data: {
                                amount: pageElemAmount,
                                page: curr_page,
                            },
                            beforeSend: function() {
                                detect_request = true
                            },
                            success: function (data) {
                                console.log(data);
                                if (data.length === 0){
                                    noMoreElementsFound ();
                                    detect_request = true;
                                    spinner_pagination.setAttribute('hidden', '');
                                } else {

                                    spinner_pagination.setAttribute('hidden', '');
                                    data.forEach(elem => {showItems(elem)});
                                    findDuplicateItems(data);
                                    addItemHandler(data);
                                    detect_request = false;
                                    curr_page += 1
                                }
                            },
                            error: function (error) {
                                console.error(error);
                                spinner_pagination.setAttribute('hidden', '');
                            }
                        });
                    }
                }
            }
        }
    }

    function showItems(elem) {
        let title = elem.title;
        let image = "";
        let price = elem.price;
        let currency = elem.currency;
        let id = elem.id;
        let description = elem.description;
        let languages = elem.languages.join(', ');
        let publishers = elem.publishers.join(', ');
        let genres = elem.genres.join(', ');
        let developers = elem.developers.join(', ');
        let platform = elem.platform;
        let region = elem.region;

        // let languages = (elem.languages === undefined) ? languages = elem.languages : languages = elem.languages.join(', ');

        // (elem.languages === undefined || elem.languages === null) ? languages = elem.languages : languages = elem.languages.join(', ');

        (elem.cover_img === "") ? image = keys_path + "images/not_available.png" : image = elem.cover_img;

        if (!id) {
            $('.product_list').append(`
            <div class="row justify-content-center p-2 product_item">
                This ID is not exist
            </div>`);
        } else {
            $('.product_list').append(`
            <div class="row justify-content-start py-2 px-0 px-md-2 product_item" data-id=${id}>
                <div class="col-2 col-md-1 col-lg-2 col-xl-1 p-0">
                    <img src=${image}
                         alt=""
                         class="product_image float-left rounded-circle">
                </div>
                <div class="col-5 product_title px-0" >${title}</div>
                <div class="col-2 px-0 add_item">
                    <div hidden class="lds-ripple spinner_loading_items"><div></div><div></div></div>
                    <button class="btn_add btn btn-sm px-2 px-sm-3"> add </button>
                </div>
                <div class="col-2 col-md-3 col-lg-2 col-xl-3 product_price pr-0 pl-1">Price: 
                    <span class="price_value">${price}</span>
                    <span class="price_currency">${currency}</span>
                </div>
                <div class="p-0"><button type="button" class="see_more_info hide"> </button> </div>
                <div class="row flex-column hidden_info mx-4 pt-4" style="display: none">
                    <div class="row full_title mx-2">
                        <span><b>Title: </b> ${title}</span>
                    </div>
                    <div class="row description mx-2">
                        <span><b>Description: </b> ${description}</span>
                    </div>
                    <div class="row id_elem mx-2">
                        <span><b> ID: </b> ${id}</span>
                    </div>
                    <div class="row item_language mx-2">
                        <span><b>Languages: </b> ${languages}</span> 
                    </div>
                    <div class="row item_publishers mx-2">
                        <span><b>Publishers: </b> ${publishers}</span>
                    </div>
                    <div class="row item_genres mx-2">
                        <span><b>Genres: </b> ${genres}</span>
                    </div>
                    <div class="row item_developers mx-2">
                        <span><b>Developers: </b> ${developers}</span>
                    </div>
                    <div class="row item_platform mx-2">
                        <span><b>Platform: </b> ${platform}</span>
                    </div>
                    <div class="row item_region mx-2">
                        <span><b>Region: </b> ${region}</span>
                    </div>
                </div>
            </div>`);
        }
    }

    function mobileItemsToggle() {
        $('.added_items_mobile').on('click', function () {
            if ($(this).hasClass('search_items_mobile')) {
                $('.chosen_products').hide("slow");
                $('.product_list').show('slow');
                $(this).removeClass('search_items_mobile').addClass('added_items_mobile').html('see all added items <i class="fas fa-arrow-right"></i> ');
            } else {
                $('.product_list').hide("slow");
                $('.chosen_products').show('slow');
                $(this).addClass('search_items_mobile').html(' <i class="fas fa-arrow-left"></i>  see search result');
            }
        });
    }

    function noData() {
        $('.product_list').append(`
            <div class="row justify-content-center p-2 product_item">
                Elements not found
            </div>`);
    }

    function noMoreElementsFound() {
        $('.product_list').append(`
            <div class="row justify-content-center product_list_footer">
                No more elements found
            </div>
        `);
    }

    function findDuplicateItems(data) {
        let idSet = '';

        if (!data.length) {
            if (!idSet)
                idSet += data.id;
            else
                idSet += ',' + data.id
        } else {
            data.forEach(id_elem => {
                if (!idSet)
                    idSet += id_elem.id;
                else
                    idSet += ',' + id_elem.id
            })
        }

        $.ajax({
            url: ajaxurl,
            type: "GET",
            data: {
                action: "kys_check_items",
                api_ids: idSet
            },
            success: function (response) {
                if (response.success) {
                    response.success.forEach((data) => {
                        $('.product_list [data-id="' + data.api_id + '"]').addClass('active_product_item').find('.btn_add').removeClass('btn_add').addClass('btn_show_item').html('<a href="' + site_path + '/wp-admin/post.php?post=' + data.id + '&action=edit" class="btn_view_item" target="_blank">view<a/>');
                    });

                    $('.product_list .check_items').hide();
                }
            },
            error: function (error) {
                console.log(error)
            }
        });
    }

    function seeMoreItemInfo() {
        $('.products_body').on('click', '.see_more_info',  function () {
            $(this).parents('.product_item, .chosen_item').find('.hidden_info').toggle();
            $(this).toggleClass('hide');
        });
    }

    function addItemHandler(data) {
        $('.product_item').on('click', '.btn_add', function () {
            // $('.btn_add').on('click', function () {

            let spinner_add = $(this).parents('.product_item').find('.spinner_loading_items');
            let product_elem = $(this).parents('.product_item');

            product_elem.addClass('loading_product_item');

            let new_item = product_elem.clone().removeClass('product_item loading_product_item').addClass('chosen_item');
            // new_item.find('.add_item').addClass('pl-1');
            $(this).removeClass('btn_add').addClass('btn_add_hide');
            new_item.find('.btn_add').removeClass('btn_add px-2 px-sm-3 btn_add_hide').addClass('btn_remove px-1 px-sm-2').html('remove');
            spinner_add.removeAttr('hidden');

            const sendItems = (id) =>{
                $(this).removeClass('btn_add_hide').addClass('btn_show_item').html(`<a href="${site_path}/wp-admin/post.php?post=${id}&action=edit" class="btn_view_item" target="_blank">view<a/>`);
                product_elem.removeClass('loading_product_item').addClass('active_product_item');
                spinner_add.attr('hidden', 'hidden');
                $('.ch_pr_text').attr('hidden', 'hidden');
                chosen_products.prepend(new_item);
                id_list.push(new_item[0].attributes[1].value);
                console.log(product_elem);

            };

            if (!data.length){
                added_items.push(data);
                data['action'] = "kys_save_item";
                save_item_send();

                function save_item_send() {
                    $.ajax({
                        url: ajaxurl,
                        type: "GET",
                        data: data,
                        success: function (response) {
                            if (response.success) {
                                sendItems(response.success.id);
                                spinner_add.attr('hidden', 'hidden');

                            }else if (response.error == 'attrs_created') {
                                save_item_send();
                            }else {
                                console.error(response.error);
                                spinner_add.attr('hidden', 'hidden');
                                product_elem.removeClass('loading_product_item product_item').addClass('error_product_item');
                                product_elem.append(`<div class="load_error"> Error loading, please reload page </div>`)
                            }
                        },
                        error: function (error) {
                            console.error(error);
                        }
                    })
                }

            } else {
                data.forEach(elem => {
                    if (elem.id == new_item[0].attributes[1].value) {
                        added_items.push(elem);
                        elem.action = "kys_save_item";

                        save_item_send();

                        function save_item_send() {
                            $.ajax({
                                url: ajaxurl,
                                type: "GET",
                                data: elem,
                                success: function (response, smt, jid) {
                                    if (response.success) {
                                        sendItems(response.success.id);
                                        spinner_add.attr('hidden', 'hidden');
                                    } else if (response.error == 'attrs_created') {
                                        save_item_send();
                                    } else {
                                        console.error(response.error);
                                        spinner_add.attr('hidden', 'hidden');
                                        product_elem.removeClass('loading_product_item product_item').addClass('error_product_item');
                                        product_elem.append(`<div class="load_error"> Error loading, please reload page </div>`)
                                    }
                                },
                                error: function (error) {
                                    console.error(error)
                                }
                            })
                        }

                    }
                });
            }
        })
    }

    function removeItem() {
        chosen_products.on('click', '.btn_remove', function () {

            const spinner_remove = $(this).parents('.chosen_item').find('.spinner_loading_items');
            const chosen_elem = $(this).parents('.chosen_item');

            $(this).removeClass('btn_remove').addClass('btn_add_hide');
            spinner_remove.removeAttr('hidden');

            added_items.forEach((elem, index) => {
                if (elem.id == chosen_elem[0].attributes[1].value){
                    added_items.splice(index, 1);
                    $.ajax({
                        url: ajaxurl,
                        type: "GET",
                        data: {
                            action:"kys_remove_item",
                            api_id: elem.id
                        },
                        success: function (response) {
                            if (response.success){

                                id_list.forEach((delete_id, index, object) => {
                                    if (chosen_elem.attr('data-id') === delete_id){
                                        object.splice(index, 1);
                                    }
                                });
                                spinner_remove.attr('hidden', 'hidden');
                                chosen_elem.remove();
                                downloaded_products.find(`[data-id = "${chosen_elem.attr('data-id')}"]`).removeClass('active_product_item')
                                    .find('.btn_show_item').removeClass('btn_show_item').addClass('btn_add').html('add');
                            } else {
                                console.warn('yopta');
                                spinner_remove.attr('hidden', 'hidden');
                                chosen_elem.append(`<div class="load_error"> Error loading, please reload page </div>`);
                                chosen_elem.removeClass('chosen_item').addClass('error_product_item ml-0');
                            }
                        },
                        error: function (error) {
                            console.error(error)
                        }
                    })
                }
            });
        })
    }

    function setInputFilter(textbox, inputFilter) {
        ["input", "keydown", "keyup", "mousedown", "mouseup", "select"].forEach(function(event) {
            textbox.addEventListener(event, function() {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (this.hasOwnProperty("oldValue")) {
                    this.value = this.oldValue;
                    this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                }
            });
        });
    }

    function tidioActivate() {
        $('.support, .mobile_btn_support, .test_mode_block_user_btn, .pop_up_nl_get_help').on('click', function () {
            $('body').append(`
            <script src="//code.tidio.co/vvubwhmpufjyibcimbophacv2uzzkql0.js"></script> 
       `);
            (function() {
                function onTidioChatApiReady() {
                    window.tidioChatApi.open();
                }
                if (window.tidioChatApi) {
                    window.tidioChatApi.on("ready", onTidioChatApiReady);
                } else {
                    document.addEventListener("tidioChat-ready", onTidioChatApiReady);
                }
            })();
        });
    }

    function isBestPriceActive() {
        $('.checkbox_cheapest').on('change', function () {
            $('#switch_on_off').toggleClass('switch_on switch_off');
        });
    }

    $('#footer-thankyou').empty();
    $('#footer-upgrade').empty();
    $('.notice, .error, .updated').hide();

})( jQuery );