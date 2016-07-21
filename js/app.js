(function() {
    // Module for Twitch API service
    var TwitchAPI = {
        getChannelData: function(channel) {
            return axios.get('https://api.twitch.tv/kraken/channels/' + channel);
        },
        getChannelStreams: function(channel) {
            return axios.get('https://api.twitch.tv/kraken/streams/' + channel);
        }
    };

    // Module for Twitch App
    var App = {
        channels: {
            list: ["brunofin", "dreamhacksc2", "tsm_dyrus", "fuslie", "gamingpowerhouse", "comster404", "OgamingSC2", "freecodecamp", "habathcx", "RobotCaleb"],
            data: {}
        },
        // Initializes the App state
        init: function() {
            var list = this.channels.list,
                channelsData = this.channels.data;

            list.forEach(function(channel) {
                if (!channelsData.hasOwnProperty(channel)) {
                    channelsData[channel] = {};
                }

                var data = channelsData[channel];

                // Call for Twitch API
                TwitchAPI.getChannelData.call(this, channel)
                    // Success
                    .then(function(response) {
                        data.logo = response.data.logo; // Channel logo
                        data.displayName = response.data.display_name; // Name displayed
                        data.url = response.data.url; // URL to channel
                        data.activity = response.data.status; // Stream 'title'
                    }.bind(this))
                    // Error handling for account suspended
                    .catch(function(err) {
                        if (err.response.status === 422) {
                            data.status = "suspended";
                            data.statusColor = "danger";
                            data.displayName = channel;
                        }
                    }.bind(this));
            }, this);
        },
        // Updates the Channels status
        updateStatus: function update() {
            // Array containing channel names used as keys by the channels data object
            var channels = Object.keys(this.channels.data);

            channels.forEach(function(channel) {
                // Object containing data from the channel object
                var data = this.channels.data[channel];
                
                if (data.status !== "suspended") {
                    // Call for Twitch API
                    TwitchAPI.getChannelStreams.call(this, channel)
                        // Success
                        .then(function(response) {
                            // The channel only is 'streaming' when its stream property is not null
                            if (response.data.stream) {
                                data.status = "streaming";
                                data.statusColor = "success";
                                data.stream = {
                                    game: response.data.stream.game, // Game being streamed
                                    preview: response.data.stream.preview, // Some stream preview pictures
                                    viewers: response.data.stream.viewers
                                }
                            } else {
                                data.stream = {};
                                data.status = "offline";
                                data.statusColor = "warning";
                            }
                        }.bind(this));
                }
            }, this);

            // Wait 1s before build
            setTimeout(function() {
                this.build();
            }.bind(this), 1000);
            
            // Update every 60 seconds
            setInterval(function() {
                update.call(this);
            }.bind(this), 60000);
        },
        // Build the DOM structure to show the Channels information
        build: function() {
            var streaming = [],
                offline = [],
                suspended = [],
                channels = Object.keys(this.channels.data),
                $listItem,
                $logo,
                $heading,
                $displayName,
                $status,
                $activity,
                $collapse,
                $link,
                $preview;


            channels.forEach(function(channel) {
                var data = this.channels.data[channel];

                // Channel list item
                $listItem = $('<a>')
                    .addClass('list-group-item clearfix')
                    .attr({
                        href: data.url,
                        target: "_blank",
                    });
                
                // data-toggle="tooltip" data-placement="top" title="Tooltip on top"
                if (data.status === 'streaming') {
                    $listItem
                        .attr({
                            href: "#collapse-" + channel,
                            "data-toggle": "collapse"
                        })
                        .removeAttr("target");
                }

                // Channel logo
                $logo = $('<img>')
                    .addClass('img-responsive img-circle logo pull-xs-left')
                    .attr({
                        src: data.logo || 'img/logo-default.jpg',
                        alt: channel
                    });
                
                // Item heading
                $heading = $('<span>')
                    .addClass('list-group-item-heading');

                // Channel display name
                $displayName = $('<span>')
                    .addClass('display-name')
                    .text(data.displayName);
                 
                // Channel status
                $status = $('<span>')
                    .addClass('label label-pill pull-xs-right label-' + data.statusColor)
                    .text(data.status[0].toUpperCase() + data.status.slice(1));

                if (data.status === 'streaming') {
                    $status.text(data.stream.viewers + " viewers");
                }

                // Append $displayName and $status to $heading
                $heading.append([$displayName, $status]);

                // Channel latest activity
                $activity = $('<p>')
                    .addClass('list-group-item-text activity')
                    .text(data.activity);

                // Append $logo, $heading and $activity to $listItem
                $listItem.append([$logo, $heading, $activity]);

                data.html = [];
                data.html.push($listItem);

                // If channel have stream to show then
                if (data.status === 'streaming') {
                    // Collapse div
                    $collapse = $('<div>')
                        .addClass('collapse hover')
                        .attr({
                            id: 'collapse-' + channel
                        });
                    
                    // Channel link
                    $link = $('<a>')
                        .attr({
                            href: data.url,
                            target: '_blank'
                        });
                        
                    // Channel image (stream preview or channel default)
                    $preview = $('<img>')
                        .addClass('img-responsive')
                        .attr({
                            src: data.stream.preview.large,
                            alt: "Stream preview."
                        });

                    // Append $preview to $link
                    $link.append($preview);

                    // Append $link to $collapse
                    $collapse.append($link);

                    
                    data.html.push($collapse);
                }

                switch (data.status) {
                    case "streaming":
                        streaming.push(data);
                        break;
                    case "offline":
                        offline.push(data);
                        break;
                    case "suspended":
                        suspended.push(data);
                }
            }, this);

            // Call inset function to update content
            this.insert([streaming, offline, suspended]);
        },
        // Inset channel elements on the page
        insert: function(arr) {
            $('#channel-list').html('');
            arr.forEach(function(list) {
                list.forEach(function(channel) {
                    $('#channel-list').append(channel.html);
                });
            });
        }
    };

    // Initialize App state
    App.init();

    // Wait 1s before call updateStatus
    setTimeout(function() {
        App.updateStatus();
    }, 1000);
})();