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
    let isLoading = false;
    let ready_to_upload = [];
    let added_items = [];
    let downloaded_products = $('.product_list');
    const chosen_products =  $('.chosen_products');
    const spinner = document.getElementById('spinner_loading');
    const imported_btn_items = $('.imported_items');
    const mobile_body_navigation = $('.mobile_body_nav');
    let spinner_pagination = document.getElementById('spinner_pagination');
    let pageElemAmount = 15;

    check_items();

    function check_items() {

        setTimeout(function () {

            if (!isLoading && ready_to_upload.length > 0) {
                $('.loading_progress').removeAttr('hidden');
                isLoading = true;

                $('.progress_number').html(ready_to_upload.length);
                let data_item = ready_to_upload.shift();

                if (data_item.action == 'add'){
                    save_item_send(data_item.data, data_item.item);
                } else if (data_item.action == 'remove'){
                    start_remove_item(data_item.data, data_item.item);
                }
            }

            if (ready_to_upload.length > 0) {
                $('.progress_number').html(ready_to_upload.length+1);
            }

            check_items();
        }, 500);
    }

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
                fetch(`${_8keysApiUrl}/user`, {
                    method: 'GET',
                    headers: {
                        'Keys-Api-Auth': $('.user_login').val()
                    },
                })
                    .then(response => response.json())
                    .then(user_data => {
                        if (!user_data.id) {
                            nonLogged();
                            $('.auth_check').html('Wrong API-Key')
                        } else {
                            Logged(user_data.first_name, user_data.last_name, user_data.balance, user_data.currency, $('.user_login').val());
                        }
                    })
            }
        }
    }

    function loginUser() {
        $('.update_key_button').on('click', function () {
            fetch(`${_8keysApiUrl}/user`, {
                method: 'GET',
                headers: {
                    'Keys-Api-Auth': $('.user_login').val()
                },
            })
                .then(response => response.json())
                .then(user_data => {
                    if (!user_data){
                        $('.auth_check').html('Error, please reload page or check connection')
                    } else {
                        if (user_data.error){
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
                                    if (data_info.success){
                                        Logged(user_data.kys_first_name, user_data.kys_last_name, user_data.kys_balance, user_data.kys_currency);
                                    } else {
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

        $('.product_list').append(`<div class="check_items"><div class="lds-ripple spinner_loading_items"><div></div><div></div></div></div>`);
        fetch(`${_8keysApiUrl}${is_cheapest}/items/all?amount=${pageElemAmount}`,{
            method: 'GET',
            headers: {
                'Keys-Api-Auth': $('.user_login').val()
            },
        })
            .then(response => response.json())
            .then(data => {
                data.forEach(elem => {
                    showItems(elem);
                });
                findDuplicateItems(data);
                addItemHandler(data, curr_page_all-1, pageElemAmount);
                spinner.setAttribute('hidden', '');
                imported_btn_items.removeAttr('hidden');
                $('.ch_pr_text').removeAttr('hidden');
                mobile_body_navigation.removeClass('d-none').addClass('d-md-flex d-lg-none');

            });

        window.onscroll = function() {
            if ((window.innerHeight + window.pageYOffset) >= document.getElementById('wpwrap').offsetHeight && !detect_request_all) {
                spinner_pagination.removeAttribute('hidden');
                $.ajax({
                    url: `${_8keysApiUrl}${is_cheapest}/items/all?amount=${pageElemAmount}`,
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
                            addItemHandler(data, curr_page_all, pageElemAmount);
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
        if (keywords.length === 0) {
            $('.search_input').attr('placeholder', 'Type a correct value');
        } else {
            $('.product_list').empty();
            $('.product_list').append(`<div class="check_items"><div class="lds-ripple spinner_loading_items"><div></div><div></div></div></div>`);
            if (keywords[0] === "#"){
                if (keywords.length > 1){
                    spinner.removeAttribute('hidden');
                    keywords = keywords.substring(1);
                    fetch(`${_8keysApiUrl}${is_test}/item/${keywords}`, {
                        method: 'GET',
                        headers: {
                            'Keys-Api-Auth': $('.user_login').val()
                        },
                    })
                        .then(response => response.json())
                        .then(data => {
                            $('.product_list').empty();
                            showItems(data);
                            findDuplicateItems(data);
                            addItemHandler([data], 0, 1);
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
                fetch(`${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}?amount=${pageElemAmount}`, {
                    method: 'GET',
                    headers: {
                        'Keys-Api-Auth': $('.user_login').val()
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        (data.length === 0) ? noData () :
                            data.forEach(elem => {
                                showItems(elem);
                            });
                        findDuplicateItems(data);
                        addItemHandler(data, curr_page-1, pageElemAmount);
                        spinner.setAttribute('hidden', '');
                        imported_btn_items.removeAttr('hidden');
                        $('.ch_pr_text').removeAttr('hidden');
                        mobile_body_navigation.removeClass('d-none').addClass('d-md-flex d-lg-none');
                    });
                window.onscroll = function() {
                    if ((window.innerHeight + window.pageYOffset) >= document.getElementById('wpwrap').offsetHeight && !detect_request) {
                        spinner_pagination.removeAttribute('hidden');
                        $.ajax({
                            url: `${_8keysApiUrl}${is_test}${is_cheapest}/items/find/${keywords}?amount=${pageElemAmount}`,
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
                                if (data.length === 0){
                                    noMoreElementsFound ();
                                    detect_request = true;
                                    spinner_pagination.setAttribute('hidden', '');
                                } else {

                                    spinner_pagination.setAttribute('hidden', '');
                                    data.forEach(elem => {showItems(elem)});
                                    findDuplicateItems(data);
                                    addItemHandler(data, curr_page, pageElemAmount);
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
                        $('.product_list [data-id="' + data.api_id + '"]').addClass('active_product_item').find('.btn_add').replaceWith('<a href="' + site_path + '/wp-admin/post.php?post=' + data.id + '&action=edit" class="btn btn-sm px-2 px-sm-3 btn_show_item" target="_blank">view<a/>');
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

    function addItemHandler(data, page, amount) {

        let from = (page-1)*amount;
        let is_loading = true;

        for (let i=from; i<from+amount; i++) {
            $('.product_item').eq(i).on('click', '.btn_add', function () {

                itm_wrapper = $(this).parents('.product_item');

                let current_item = {
                    spinner_add: $(this).parents('.product_item').find('.spinner_loading_items'),
                    original: itm_wrapper,
                    new_item: itm_wrapper.clone().removeClass('product_item loading_product_item').addClass('chosen_item'),
                };

                current_item.original.addClass('loading_product_item');
                current_item.original.find('.btn_add').removeClass('btn_add').addClass('btn_add_hide');
                current_item.new_item.find('.btn_add').removeClass('btn_add px-2 px-sm-3 btn_add_hide').addClass('btn_remove px-1 px-sm-2').html('remove');
                current_item.spinner_add.removeAttr('hidden');


                if (data.length){
                    ready_to_upload.push({data: data[i-from], item: current_item, action: 'add'});
                }
            })
        }
    }

    const sendItems = (id, item) =>{
        item.original.find('.btn_add_hide').replaceWith(`<a href="${site_path}/wp-admin/post.php?post=${id}&action=edit" class="btn btn-sm px-2 px-sm-3 btn_show_item" target="_blank">view<a/>`);
        item.original.removeClass('loading_product_item').addClass('active_product_item');
        item.original.find('.spinner_loading_items').attr('hidden', 'hidden');
        $('.ch_pr_text').attr('hidden', 'hidden');
        chosen_products.prepend(item.new_item);
        id_list.push(item.new_item[0].attributes[1].value);

    };

    function save_item_send(data, item) {
        data.action = "kys_save_item";

        $.ajax({
            url: ajaxurl,
            type: "GET",
            data: data,
            success: function (response, smt, jid) {
                if (response.success) {
                    added_items.push(data);
                    sendItems(response.success.id, item);
                    item.spinner_add.attr('hidden', 'hidden');
                } else if (response.error == 'attrs_created') {
                    save_item_send(data);
                } else {
                    console.error(response.error);
                    item.spinner_add.attr('hidden', 'hidden');
                    item.original.removeClass('loading_product_item product_item').addClass('error_product_item');

                    if (response.error)
                        item.original.append(`<div class="load_error">${response.error}</div>`);
                    else
                        item.original.append(`<div class="load_error">Error loading, please reload page</div>`);
                }
            },
            complete: function () {
                isLoading = false;
                if (ready_to_upload.length === 0){
                    $('.loading_progress').attr('hidden', 'hidden');
                }
            },
            error: function (error) {
                console.error(error)
            }
        })
    }

    function removeItem() {
        chosen_products.on('click', '.btn_remove', function () {

            const spinner_remove = $(this).parents('.chosen_item').find('.spinner_loading_items');
            const chosen_elem = $(this).parents('.chosen_item');

            let remove_item = {
                spinner_remove : $(this).parents('.chosen_item').find('.spinner_loading_items'),
                origin: chosen_elem
            };

            $(this).removeClass('btn_remove').addClass('btn_add_hide');
            spinner_remove.removeAttr('hidden');

            ready_to_upload.push({data: {api_id: remove_item.origin[0].attributes[1].value}, item: remove_item, action: 'remove'});
        })
    }

    function start_remove_item(data, item) {
        data.action = "kys_remove_item";

        $.ajax({
            url: ajaxurl,
            type: "GET",
            data: data,
            success: function (response) {
                if (response.success){
                    item.spinner_remove.attr('hidden', 'hidden');
                    item.origin.remove();
                    downloaded_products.find(`[data-id = "${item.origin.attr('data-id')}"]`).removeClass('active_product_item')
                        .find('.btn_show_item').replaceWith(`<button class="btn_add btn btn-sm px-2 px-sm-3"> add </button>`);
                } else {
                    console.warn('Remove elem error');
                    item.spinner_remove.attr('hidden', 'hidden');

                    if (response.error)
                        item.origin.append(`<div class="load_error">${response.error}</div>`);
                    else
                        item.origin.append(`<div class="load_error">Error loading, please reload page</div>`);

                    item.origin.removeClass('chosen_item').addClass('error_product_item ml-0');
                }
            },
            complete: function () {
                isLoading = false;
                if (ready_to_upload.length === 0){
                    $('.loading_progress').attr('hidden', 'hidden');
                }
            },
            error: function (error) {
                console.error(error)
            }
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