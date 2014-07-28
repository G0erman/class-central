jQuery(function($) {

    $.ajaxSetup ({
        cache: false
    });

    courseListCheckboxHandler = function(){
        var clicked = this;
        // Check if the user is logged in
        $.ajax({
            url: "/ajax/isLoggedIn",
            cache: true
        })
            .done(function(result){
                var loggedInResult = $.parseJSON(result);
                if(loggedInResult.loggedIn) {
                    var name = $(clicked).attr("name");
                    if($(clicked).is(':checked')) {
                        if( $('span[id=' + name + ']').html().trim() == '+' || $('span[id=' + name + ']').html().trim() == '-') {
                            $('span[id=' + name + ']').html('-');
                        } else {
                            $('span[id=' + name + ']').html('<svg class="icon-minus" viewBox="0 0 32 32"><use xlink:href="#icon-minus"></use></svg>');
                        }

                        // uncheck the rest
                        $('input[name=' + name +']:checked').each(function(){
                            $(this).prop('checked',false);
                        });
                        // check this one back
                        $(clicked).prop('checked',true);
                    } else {
                        if( $('span[id=' + name + ']').html().trim() == '+' || $('span[id=' + name + ']').html().trim() == '-') {
                            $('span[id=' + name + ']').html('+');
                        } else {
                            $('span[id=' + name + ']').
                                html('<svg class="icon-plus" viewBox="0 0 32 32"><use xlink:href="#icon-plus"></use></svg>');
                        }

                    }

                    addRemoveCourse($(clicked).val(), $(clicked).data('course-id'),$(clicked).is(':checked'), $(clicked).data('course-name'));
                } else {
                    // redirect to signup page
                    window.location.replace("/signup/cc/" +$(clicked).data('course-id')+ "/"+ $(clicked).val());
                }
            });
    }

    // Handle calls to add/remove courses to users library
    $('input[class="course-list-checkbox"]').change( courseListCheckboxHandler );

    // Completed, Audited, Partially Completed, Drooped
    var listCourseDone = [
        3,4,5,6
    ];

    // Enrolled, Current
    var listEnrolled = [
        2,7
    ];

    function updateCounter( incr )
    {
        var start = parseInt( $('#mycourses-listed-count').text() );
        var end;
        if(incr) {
            end = start + 1;
        } else {
            end = start - 1;
        }

        var numAnim = new countUp("mycourses-listed-count", start, end, 0, 1);
        numAnim.start();
    }

    function addRemoveCourse(listId, courseId, checked,name) {
        try{
            if(checked){
                _gaq.push(['_trackEvent','My Courses - Add',listId.toString(), courseId.toString()]);
            }else {
                _gaq.push(['_trackEvent','My Courses - Remove', listId.toString(),  courseId.toString() ]);
            }
        }catch(err){}
        if(checked){
            $.ajax( "/ajax/user/course/add?c_id=" +courseId +"&l_id="+ listId)
                .done(
                function(result){
                    var r = JSON.parse(result);
                    if(r.success)
                    {
                        if( typeof courseAdded != 'undefined' && !courseAdded) {
                            updateCounter(true);
                            courseAdded = true;
                        }

                        if($.inArray(Number(listId), listCourseDone) >= 0)
                        {
                            // Ask them to review the course
                            notifyWithDelay(
                                'Course added',
                                'Would you like to review it? It takes no time at all ' +
                                    '<br/><a href="/review/new/' + courseId+ '">Review ' + name +
                                    '</a> ',
                                'success',
                                60
                            );
                        }
                        else if($.inArray(Number(listId), listEnrolled) >= 0)
                        {
                            // Ask them to review once they are done with the course
                            notifyWithDelay(
                                'Course added',
                                '<i>'+ name +'</i> added to <a href="/user/courses">My Courses</a> successfully. ' +
                                    'Don\'t forget to <a href="/review/new/' + courseId + '">review</a> the course once you finish it'
                                ,
                                'success',
                                30
                            );
                        }
                        else
                        {
                            // Interested
                            notify(
                                'Course added',
                                '<i>'+ name +'</i> added to <a href="/user/courses">My Courses</a> successfully',
                                'success'
                            );
                        }



                    }
                }
            );
        } else {
            $.ajax( "/ajax/user/course/remove?c_id=" +courseId +"&l_id="+ listId)
                .done(
                function(result){
                    var r = JSON.parse(result);
                    if(r.success)
                    {
                        // Decrement count - Course page
                        if( typeof courseAdded != 'undefined')
                        {
                            updateCounter(false);
                            courseAdded = false;
                        }
                        notify(
                            'Course removed',
                            '<i>'+ name +'</i> removed from <a href="/user/courses">My Courses</a> successfully',
                            'success'
                        );
                    }
                }
            );
        }
    }

    function notify( title, text, type)
    {
        new PNotify({
            title: title,
            text: text,
            type: type,
            animation: 'show'
        });
    }

    function notifyWithDelay( title, text, type, delay)
    {
        new PNotify({
            title: title,
            text: text,
            type: type,
            animation: 'show',
            delay: delay * 1000
        });
    }

    // Select dropdown on course pages
    $('#sessionOptions').change(function() {
        var selected = $(this).find('option:selected');
        var url = selected.data("url");
        var sessionType = selected.data('sessiontype');
        var sessionStatus = selected.data('sessionstatus');
        var sessionStartDate = selected.data('sessionstartdate');

        // Update the user of the href tag
        $('#btnProviderCoursePage').attr("href",url);

        // Update the add to calendar button
        $('._start').html(sessionStartDate);
        $('._end').html(sessionStartDate);
        if(sessionType=='upcoming' && sessionStatus == '1') {
            $('.btnAddToCalendar').show();
        }
        else {
            $('.btnAddToCalendar').hide();
        }

    });


    // relevant to course information page and course tables
    // stop dropdown from closing when its inside elements are clicked on
    $('.course-button-group .dropdown-menu').bind('click', function (e) {
        //e.stopPropagation();
    });

    $('.table .dropdown-menu').bind('click', function (e) {
        //e.stopPropagation();
    });

    /**
     * User preferences - Newsletter
     */
    $('input[class="user-newsletter-checkbox"]').change(function(){
        var clicked = this;
        // Check if the user is logged in
        $.ajax({
            url: "/ajax/isLoggedIn",
            cache: true
        })
            .done(function(result){
                var loggedInResult = $.parseJSON(result);
                if(loggedInResult.loggedIn) {
                    updateSubscription($(clicked).val(), $(clicked).is(':checked'));
                } else {
                    // redirect to loginpage page
                    window.location.replace("/login");
                }
            });
    });

    var updateSubscription = function(code, checked) {
        try{
            if(checked){
                _gaq.push(['_trackEvent','Newsletter Preferences','Subscribed', code]);
            }else {
                _gaq.push(['_trackEvent','Newsletter Preferences','Unsubscribed', code]);
            }
        }catch(err){}

        if(checked){
            $.ajax( "/ajax/newsletter/subscribe/"+code)
                .done(
                function(result){
                    //console.log("jquery" + result);
                }
            );
        } else {
            $.ajax("/ajax/newsletter/unsubscribe/"+code)
                .done(
                function(result){
                    //console.log("jquery" + result);
                }
            );
        }
    }

    /**
     * User Preferences - MOOC Tracker preferences
     */
    $('input[class="mooc-tracker-checkbox"]').change(function(){
        var clicked = this;
        // Check if the user is logged in
        $.ajax({
            url: "/ajax/isLoggedIn",
            cache: true
        })
            .done(function(result){
                var loggedInResult = $.parseJSON(result);
                if(loggedInResult.loggedIn) {
                    updateUserPreference($(clicked).val(), $(clicked).is(':checked'));
                } else {
                    // redirect to loginpage page
                    window.location.replace("/login");
                }
            });
    });

    var updateUserPreference = function(prefId, checked) {
        try{
            if(checked){
                _gaq.push(['_trackEvent','MOOC Tracker Preferences','Checked', prefId]);
            }else {
                _gaq.push(['_trackEvent','MOOC Tracker Preferences','UnChecked', prefId]);
            }
        }catch(err){}
        if(checked){
            $.ajax( "/ajax/user/pref/"+ prefId + "/1")
                .done(
                function(result){
                    // console.log("jquery" + result);
                }
            );
        } else {
            $.ajax("/ajax/user/pref/"+ prefId + "/0")
                .done(
                function(result){
                    //console.log("jquery" + result);
                }
            );
        }
    }

    /**
     * Reviews and ratings
     */
    var isEmpty = function(str) {
        return (!str || 0 === str.length);
    }

    $('#review-text').autosize();

    loadRaty = function() {
        var ratyDefaults = {
            starHalf    : '/bundles/classcentralsite/slashpixel/images/star-half-gray.png',
            starOff     : '/bundles/classcentralsite/slashpixel/images/star-off-gray.png',
            starOn      : '/bundles/classcentralsite/slashpixel/images/star-on-gray.png',
            hints       : ['','','','',''],
            size        : 21,
            score       : function() {
                return $(this).attr('data-score');
            }
        };

        $('#rating').raty(ratyDefaults);

        $('.course-rating').raty($.extend(
            {
                readOnly: true
            },
            ratyDefaults
        ));

        $('.user-rating').raty($.extend(
            {
                readOnly: true
            },
            ratyDefaults
        ));
    }

    loadRaty();

    /**
     * Review course
     */
    $('#submit-review').click(function(event){
        event.preventDefault();
        $('#submit-review').attr('disabled',true);

        var review = getReviewFormFields();
        var validationError = validateReviewForm(review);

        if(!validationError) {
            try{
                if(review.reviewId === undefined){
                    _gaq.push(['_trackEvent', 'Create Review', " " + $('#courseId').data("value")]);
                } else {
                    _gaq.push(['_trackEvent', 'Update Review'," " +  $('#courseId').data("value")]);
                }
            } catch(err){}

            $.ajax({
                type:"post",
                url:"/user/review/create/" + $('#courseId').data("value"),
                data:JSON.stringify(review)
            })
                .done(
                function(result){
                    result = JSON.parse(result);
                    if(result['success']) {
                        // Redirect to the course page
                        window.location.href = $('#courseUrl').data("value");
                    } else {
                        // Show an error message
                    }
                }
            );

        } else {
            $('#submit-review').attr('disabled',false);

        }

    });

    $('#submit-signup-review').click(function(event){
        event.preventDefault();
        $('#submit-signup-review').attr('disabled', true);

        var review = getReviewFormFields();
        var validationError = validateReviewForm(review);

        if(!validationError) {
            $('#signupForm').on('hidden.bs.modal',function(e){
                location.reload();
            });
            $.ajax({
                type:"post",
                url:"/review/save/" + $('#courseId').data("value"),
                data:JSON.stringify(review)
            })
                .done(
                function(result){
                    result = JSON.parse(result);
                    if(result['success']) {
                        // Clear the form
                        var rating = $('#rating').raty('score');
                        $('textarea[name=review-text]').val("");
                        $('input:radio[name=progress]:checked').prop('checked',false);

                        // Redirect to the course page
                        $('#signupForm').modal('show');
                    } else {
                        // Show an error message
                        showPinesNotification('error','Some error occurred',result['message']);
                    }
                }
            );

        }

    });



    var getReviewFormFields = function() {
        // Get all the fields
        var rating = $('#rating').raty('score');
        var reviewText = $('textarea[name=review-text]').val();
        var effort = $('input:text[name=effort]').val();
        var progress = $('input:radio[name=progress]:checked').val();
        var difficulty = $('input:radio[name=difficulty]:checked').val();
        var level = $('input:radio[name=level]:checked').val();
        var offeringId = $('#sessionOptions').val();
        var status = $('#reviewStatus').val();
        var reviewId = $('#reviewid').data("value");
        var externalReviewerName = $('#ext-reviewer-name').val();
        var externalReviewLink = $('#ext-review-link').val();

        var review = {
            'rating': rating,
            'reviewText': reviewText,
            'effort': effort,
            'progress': progress,
            'difficulty': difficulty,
            'level':level,
            'offeringId':offeringId,
            'status':status,
            'reviewId':reviewId,
            'externalReviewerName': externalReviewerName,
            'externalReviewLink': externalReviewLink
        };

        return review;
    }

    var validateReviewForm = function(review) {
        // Validate the form
        var validationError = false;

        // Rating cannot be empty
        if(review.rating === undefined) {
            $('#rating-error').show();
            validationError = true;
        } else {
            $('#rating-error').hide();
        }

        // progress cannot be empty
        if(review.progress === undefined) {
            $('#progress-error').show();
            validationError = true;
        } else {
            $('#progress-error').hide();
        }

        // Review if exits should be atleast 20 words long
        if(!isEmpty(review.reviewText)) {
            // Non empty review. Should be 20 words long
            var words = review.reviewText.split(' ');
            if(words.length < 20) {
                $('#review-text-error').show();
                validationError = true;
            } else {
                $('#review-text-error').hide();
            }
        } else {
            $('#review-text-error').hide();
        }

        return validationError;
    }



    // Review feedback
    $('.review-feedback').bind('click',function(e){
        e.preventDefault();

        var helpful = $(this).text();
        var reviewId = $(this).data('reviewid');
        var feedback = (helpful === 'NO') ? 0 : 1;

        $.ajax("/ajax/review/feedback/"+ reviewId+"/"+feedback)
            .done(function(result){
                $('#review-feedback-'+reviewId).text("Thank you for your feedback.");
            });

    });

    // Default notification false
    //$.pnotify.defaults.history = false;

    var showPinesNotification = function(type,title,text){
        new PNotify({
            title: title,
            text: text,
            type: type,
            animation: 'show'
        });
    }

    // Pines notification
    $('.flash-message').each(function(index,element){

        new PNotify({
            title: $(element).data('title'),
            text: $(element).text(),
            type: $(element).data('type'),
            animation: 'show',
            delay: $(element).data('delay') * 1000
        });
    });


    $('.faq-box .question').click( function() {
        var parent = $(this).parent();
        if (parent.hasClass('show-answer') ) {
            parent.find('.answer').hide();
            parent.toggleClass('show-answer');
        } else {
            parent.find('.answer').show();
            parent.toggleClass('show-answer');
        }
    });

    $('.faq-wrap .faq-question').click( function() {
        var parent = $(this).parent();
        if (parent.hasClass('show-answer') ) {
            parent.find('.faq-answer').hide();
            parent.toggleClass('show-answer');
        } else {
            parent.find('.faq-answer').show();
            parent.toggleClass('show-answer');
        }
    });

    // front page tab nav
    $(".section-tab-content").css("height", "0");
    defaultTab = $(".active-tab > a").data("target-section");
    $("." + defaultTab).css("height", "auto");
    $('nav.page-tabs').on('click', 'ul > li > a', function(event) {
        event.preventDefault();
        $this = $(this);
        targetTab = $this.data("target-section");
        if (targetTab !== undefined) {
            $(".section-tab-content").css("height", "0");
            $("." + targetTab).css("height", "auto");
            $("nav.page-tabs ul > li").removeClass("active-tab");
            $this.closest("li").addClass("active-tab");
            $.scrollTo('.page-tabs',{ duration: 400 });
        }
        else {
            targetTab = 'create-free-account'; // signup button
        }
        try {
            _gaq.push(['_trackEvent','Homepage Tab clicks',targetTab]);
        } catch (e) {
            console.log("error");
        }
    });

    $('.course-data-row .dropdown-menu input').click(function(e) {
        e.stopPropagation();
    });

    $('.course-data-row .dropdown-menu label').click(function(e) {
        e.stopPropagation();
    });

    // expand single reviews
    $('.course-all-reviews').on('click', '.expand-preview', function(event) {
        event.preventDefault();
        $this = $(this);
        $this.parent().hide();
        $this.closest(".review-content").find(".review-full").show();
        $this.hide();
    });

    /*
     Search functionality
     */
    var customRenderFunction = function(document_type, item) {
        var title = '<p class="title">' + item['name'] + '</p>';
        if(document_type == 'courses') {
            var ins = '';
            if(typeof item['institutions'] !== 'undefined' && item['institutions'] != '' ) {
                ins = item['institutions'][0] + ' - ';
            }
            var provider = '';
            if(typeof item['provider'] !== 'undefined' && item['provider'] != '' ) {
                provider = ' | ' + item['provider'];
            }

            return title.concat('<p>' + ins + item['displayDate'] + provider + '</p>');
        } else if (document_type == 'universities' || document_type == 'subjects') {
            return title.concat('<p class="genre">' + item['courseCount'] + ' courses </p>');
        }
    };

    // Autocomplete
    /*
    $('#st-search-input').swiftype({
        renderFunction: customRenderFunction,
        engineKey: '{{ swiftype_engine_key }}',
        filters: {
            'courses' : {'status':{
                'type' : 'range',
                'to' : 99
            }},
            'universities': {'courseCount':{
                'type' : 'range',
                'from' : '1'
            }}
        }
    });
    */



    // Navbar search button
    $('#navbar-search-btn').click(function(e){
        e.preventDefault();
        $('#navbar-search-form').submit();
    });


    $('#home-create-free-account').click( function(e){
        e.preventDefault();
        $('#signupForm').modal('show');
        try {
            _gaq.push(['_trackEvent','Create Free Account','Home Tab']);
        }catch (e){}
    });

    $('#convincer-create-free-account').click( function(e){
        e.preventDefault();
        $('#signupForm').modal('show');
        try {
            _gaq.push(['_trackEvent','Create Free Account','Convincer']);
        }catch (e){}
    });

    // Typeahead
    var testSearch = new Bloodhound({
        datumTokenizer: function (datum) {
            return Bloodhound.tokenizers.whitespace(datum.value);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
            url: '/autocomplete/%QUERY',
            filter: function (data) {

                return $.map(data.autocomplete[0].options, function (option) {
                    return {
                        payload: option.payload

                    };
                });

            }
        }
    });

    testSearch.initialize();

    $('#navbar-search-form .cc-search-box').typeahead(null, {
        name: '',
        displayKey: 'payload.name',
        source: testSearch.ttAdapter(),
        templates: {
            empty: [
                '<div class="empty-message">',
                'unable to find any subjects or courses that match the current query',
                '</div>'
            ].join('\n'),
            suggestion: Handlebars.compile(
                '<a class="type-{{payload.type}}" href="{{payload.url}}">'
                    + '<span class="name">{{payload.name}}</span>'
                    + '{{#if payload.nextSession}}'
                    + '<span class="next-session">{{payload.nextSession}}</span>'
                    + '{{/if}}'
                    + '{{#if payload.count}}'
                    + '<span class="course-count">{{payload.count}} courses</span>'
                    + '{{/if}}'
                    + '</a>'
            )
        }
    });

    $('#navbar-search-form .tt-dropdown-menu').bind("DOMSubtreeModified", function() {
        if  ($('#navbar-search-form .tt-dropdown-menu .tt-suggestions').length) {
            $('body').addClass('tt-is-open');
        } else {
            $('body.tt-is-open').removeClass('tt-is-open');
        }
    });


});
