const Conversation = require("../models/Conversation");
const Message = require("../models/Message");


let io; // Declare a variable for Socket.IO

const setSocketIO = (socketIO) => {
  io = socketIO; // Assign the Socket.IO instance to the local variable
};

const createMessage = async (req, res, next) => {
  const newMessage = new Message({
    conversationId: req.body.conversationId,
    userId: req.userId,
    desc: req.body.desc,
  });

  try {
    const savedMessage = await newMessage.save();

    await Conversation.findOneAndUpdate(
      { id: req.body.conversationId },
      {
        $set: {
          readBySeller: req.isSeller,
          readByBuyer: !req.isSeller,
          lastMessage: req.body.desc,
        },
      },
      { new: true }
    );

    // Emit the message to the conversation room
    // io.to(req.body.conversationId).emit('receiveMessage', savedMessage);

    res.status(201).send(savedMessage);
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ conversationId: req.params.id });
    res.status(200).send(messages);
  } catch (error) {
    next(error);
  }
};


const searchSensitiveMessages = async (req, res) => {
  try {
    // Define regex patterns for each category of sensitive information
    const patterns = {
      emailDomains: [
        'gmail\\.com', 'yahoo\\.com', 'hotmail\\.com',
        'outlook\\.com', 'aol\\.com', 'icloud\\.com',
        'protonmail\\.com', 'zoho\\.com', 'mail\\.com',
        'yandex\\.com'
      ],
      socialMediaLinks: [
        'facebook\\.com', 'twitter\\.com', 'instagram\\.com',
        'linkedin\\.com', 'snapchat\\.com', 'tiktok\\.com',
        'reddit\\.com', 'tumblr\\.com', 'pinterest\\.com',
        'flickr\\.com', 'quora\\.com', 'wechat\\.com'
      ],
      usernamePatterns: [
        'username', '#username', 'www\\.instagram\\.com\\/username',
        'linkedin\\.com\\/in\\/username', 'fb\\.me\\/username',
        'twitter\\.com\\/username', 'tiktok\\.com\\/username'
      ],
      paymentPatterns: [
        'credit card', 'debit card', 'bank account',
        'paypal', 'venmo', 'cash app', 'account number',
        'sort code', 'iban', 'xxxx-xxxx-xxxx-xxxx', 'cvv', 'expiry date',
        'ssn', 'routing number', 'bic', 'swift code',
        'card number', 'cardholder name',
        'c_r_e_d_i_t c_a_r_d', 'd_e_b_i_t c_a_r_d', 'b_a_n_k_ a_c_c_o_u_n_t',
        'p_a_y_p_a_l', 'v_e_n_m_o', 'c_a_s_h_ a_p_p', 'a_c_c_o_u_n_t_ n_u_m_b_e_r',
        's_o_r_t_ c_o_d_e', 'i_b_a_n', 'x_x_x_x- x_x_x_x- x_x_x_x- x_x_x_x', 'c_v_v', 'e_x_p_i_r_y_ d_a_t_e',
        's_s_n', 'r_o_u_t_i_n_g_ n_u_m_b_e_r', 'b_i_c', 's_w_i_f_t_ c_o_d_e',
        'c_a_r_d_ n_u_m_b_e_r', 'c_a_r_d_h_o_l_d_e_r_ n_a_m_e',
        'c_r_e_d_i_t_-_c_a_r_d', 'd_e_b_i_t_-_c_a_r_d', 'b_a_n_k_-_a_c_c_o_u_n_t',
        'p_a_y_p_a_l', 'v_e_n_m_o', 'c_a_s_h_-_a_p_p', 'a_c_c_o_u_n_t_-_n_u_m_b_e_r',
        's_o_r_t_-_c_o_d_e', 'i_b_a_n', 'x_x_x_x-_x_x_x_x-_x_x_x_x-_x_x_x_x', 'c_v_v', 'e_x_p_i_r_y_-_d_a_t_e',
        's_s_n', 'r_o_u_t_i_n_g_-_n_u_m_b_e_r', 'b_i_c', 's_w_i_f_t_-_c_o_d_e',
        'c_a_r_d_-_n_u_m_b_e_r', 'c_a_r_d_h_o_l_d_e_r_-_n_a_m_e',
        'c-r-e-d-i-t c-r-d', 'd-e-b-i-t c-r-d', 'b-a-n-k a-c-c-o-u-n-t',
        'p-a-y-p-a-l', 'v-e-n-m-o', 'c-a-s-h a-p-p', 'a-c-c-o-u-n-t n-u-m-b-e-r',
        's-o-r-t c-o-d-e', 'i-b-a-n', 'x-x-x-x-x-x-x-x-x-x-x-x', 'c-v-v', 'e-x-p-i-r-y d-a-t-e',
        's-s-n', 'r-o-u-t-i-n-g n-u-m-b-e-r', 'b-i-c', 's-w-i-f-t c-o-d-e',
        'c-a-r-d n-u-m-b-e-r', 'c-a-r-d-h-o-l-d-e-r n-a-m-e',
        'c_r_e_d_i_t-_c_a_r_d', 'd_e_b_i_t-_c_a_r_d', 'b_a_n_k-_a_c_c_o_u_n_t',
        'p_a_y_p_a_l', 'v_e_n_m_o', 'c_a_s_h-_a_p_p', 'a_c_c_o_u_n_t-_n_u_m_b_e_r',
        's_o_r_t-_c_o_d_e', 'i_b_a_n', 'x_x_x_x-_x_x_x_x-_x_x_x_x-_x_x_x_x', 'c_v_v', 'e_x_p_i_r_y-_d_a_t_e',
        's_s_n', 'r_o_u_t_i_n_g-_n_u_m_b_e_r', 'b_i_c', 's_w_i_f_t-_c_o_d_e',
        'c_a_r_d-_n_u_m_b_e_r', 'c_a_r_d_h_o_l_d_e_r-_n_a_m_e',
        'c-r-e-d-i-t-c-a-r-d', 'd-e-b-i-t-c-a-r-d', 'b-a-n-k-a-c-c-o-u-n-t',
        'p-a-y-p-a-l', 'v-e-n-m-o', 'c-a-s-h-a-p-p', 'a-c-c-o-u-n-t-n-u-m-b-e-r',
        's-o-r-t-c-o-d-e', 'i-b-a-n', 'x-x-x-x-x-x-x-x-x-x-x-x', 'c-v-v', 'e-x-p-i-r-y-d-a-t-e',
        's-s-n', 'r-o-u-t-i-n-g-n-u-m-b-e-r', 'b-i-c', 's-w-i-f-t-c-o-d-e',
        'c-a-r-d-n-u-m-b-e-r', 'c-a-r-d-h-o-l-d-e-r-n-a-m-e'
    ],    
      contactInfoPatterns: [
        'my email is', 'you can contact me at', 'here’s my number',
        'follow me on', 'dm me on', 'my address is', 'reach out to me at',
        'connect with me', 'let’s connect on', 'contact me at',
        'call me at', 'Pleasse message me at', 'you can reach me at'
      ],
      fileSharingLinks: [
        'drive\\.google\\.com', 'dropbox\\.com', 'onedrive\\.live\\.com',
        'wetransfer\\.com', 'mediafire\\.com', 'box\\.com',
        'icloud\\.com\\/iclouddrive', 'sendspace\\.com', 'megaupload\\.com'
      ],
      personalInfoPatterns: [
        'full name', 'date of birth', 'dob', 'social security number',
        'ssn', 'driver’s license', 'passport number', 'national ID',
        'personal ID', 'tax ID', 'TIN', 'birth certificate',
        'marital status', 'mother’s maiden name'
      ],
      locationInfoPatterns: [
        'located at', 'home address', 'office address',
        'city', 'zip code', 'postal code', 'state', 'country',
        'apartment number', 'suite number', 'landmark'
      ],
      securityInfoPatterns: [
        'password', 'pin', 'otp', 'one-time password',
        'security question', 'secret answer', 'two-factor authentication',
        '2fa', 'login credentials', 'authentication code'
      ],
      socialPatterns: [
        'facebook', 'twitter', 'instagram', 'linkedin',
        'tiktok', 'snapchat', 'pinterest', 'reddit',
        'tumblr', 'youtube', 'whatsapp', 'wechat',
        'telegram', 'discord', 'slack', 'quora',
        'flickr', 'vk', 'dailymotion', 'mix',
        'facebook_', 'twitter_', 'instagram_', 'linkedin_',
        'tiktok_', 'snapchat_', 'pinterest_', 'reddit_',
        'tumblr_', 'youtube_', 'whatsapp_', 'wechat_',
        'facebook-', 'twitter-', 'instagram-', 'linkedin-',
        'tiktok-', 'snapchat-', 'pinterest-', 'reddit-',
        'tumblr-', 'youtube-', 'whatsapp-', 'wechat-',
        'facebook_-', 'twitter_-', 'instagram_-', 'linkedin_-',
        'tiktok_-', 'snapchat_-', 'pinterest_-', 'reddit_-',
        'tumblr_-', 'youtube_-', 'whatsapp_-', 'wechat_-',
        'facebook-_', 'twitter-_', 'instagram-_', 'linkedin-_',
        'tiktok-_', 'snapchat-_', 'pinterest-_', 'reddit-_',
        'tumblr-_', 'youtube-_', 'whatsapp-_', 'wechat-_',
        '_facebook', '_twitter', '_instagram', '_linkedin',
        '_tiktok', '_snapchat', '_pinterest', '_reddit',
        '_tumblr', '_youtube', '_whatsapp', '_wechat',
        '-facebook', '-twitter', '-instagram', '-linkedin',
        '-tiktok', '-snapchat', '-pinterest', '-reddit',
        '-tumblr', '-youtube', '-whatsapp', '-wechat',
        '_facebook_', '_twitter_', '_instagram_', '_linkedin_',
        '_tiktok_', '_snapchat_', '_pinterest_', '_reddit_',
        '_tumblr_', '_youtube_', '_whatsapp_', '_wechat_',
        '-facebook-', '-twitter-', '-instagram-', '-linkedin-',
        '-tiktok-', '-snapchat-', '-pinterest-', '-reddit-',
        '-tumblr-', '-youtube-', '-whatsapp-', '-wechat-',
        '_f_a_c_e_b_o_o_k', '_t_w_i_t_t_e_r', '_i_n_s_t_a_g_r_a_m', '_l_i_n_k_e_d_i_n',
        '_t_i_k_t_o_k', '_s_n_a_p_c_h_a_t', '_p_i_n_t_e_r_e_s_t', '_r_e_d_d_i_t',
        '_t_u_m_b_l_r', '_y_o_u_t_u_b_e', '_w_h_a_t_s_a_p_p', '_w_e_c_h_a_t',
        '-f-a-c-e-b-o-o-k', '-t-w-i-t-t-e-r', '-i-n-s-t-a-g-r-a-m', '-l-i-n-k-e-d-i-n',
        '-t-i-k-t-o-k', '-s-n-a-p-c-h-a-t', '-p-i-n-t-e-r-e-s-t', '-r-e-d-d-i-t',
        '-t-u-m-b-l-r', '-y-o-u-t-u-b-e', '-w-h-a-t-s-a-p-p', '-w-e-c-h-a-t',    
        'f_a_c_e_b_o_o_k', 't_w_i_t_t_e_r', 'i_n_s_t_a_g_r_a_m', 'l_i_n_k_e_d_i_n',
    't_i_k_t_o_k', 's_n_a_p_c_h_a_t', 'p_i_n_t_e_r_e_s_t', 'r_e_d_d_i_t',
    't_u_m_b_l_r', 'y_o_u_t_u_b_e', 'w_h_a_t_s_a_p_p', 'w_e_c_h_a_t',
    'f-a-c-e-b-o-o-k', 't-w-i-t-t-e-r', 'i-n-s-t-a-g-r-a-m', 'l-i-n-k-e-d-i-n',
    't-i-k-t-o-k', 's-n-a-p-c-h-a-t', 'p-i-n-t-e-r-e-s-t', 'r-e-d-d-i-t',
    't-u-m-b-l-r', 'y-o-u-t-u-b-e', 'w-h-a-t-s-a-p-p', 'w-e-c-h-a-t',
    '_t_u_m_b_l_r', '_y_o_u_t_u_b_e', '_w_h_a_t_s_a_p_p', '_w_e_c_h_a_t',
    '-f-a-c-e-b-o-o-k', '-t-w-i-t-t-e-r', '-i-n-s-t-a-g-r-a-m', '-l-i-n-k-e-d-i-n',
    '-t-i-k-t-o-k', '-s-n-a-p-c-h-a-t', '-p-i-n-t-e-r-e-s-t', '-r-e-d-d-i-t',
    '-t-u-m-b-l-r', '-y-o-u-t-u-b-e', '-w-h-a-t-s-a-p-p', '-w-e-c-h-a-t',
    'f_a_c_e_b_o_o_k', 't_w_i_t_t_e_r', 'i_n_s_t_a_g_r_a_m', 'l_i_n_k_e_d_i_n',
    't_i_k_t_o_k', 's_n_a_p_c_h_a_t', 'p_i_n_t_e_r_e_s_t', 'r_e_d_d_i_t',
    't_u_m_b_l_r', 'y_o_u_t_u_b_e', 'w_h_a_t_s_a_p_p', 'w_e_c_h_a_t',
    'f-a-c-e_b-o-o-k', 't-w-i-t-t-e-r', 'i-n-s-t-a-g-r-a-m', 'l-i-n-k-e-d-i-n',
    't-i-k-t-o-k', 's-n-a-p-c-h-a-t', 'p-i-n-t-e-r-e-s-t', 'r-e-d-d-i-t',
    't-u-m-b-l-r', 'y-o-u-t-u-b-e', 'w-h-a-t-s-a-p-p', 'w-e-c-h-a-t',
        'myspace', 'periscope', 'tumblr', 'soundcloud',
        'twitch', 'foursquare', 'yelp', 'meetup',
        'gab', 'parler', 'ello', 'clubhouse',
        'reddit', 'badoo', 'okcupid', 'match',
        'happn', 'tinder', 'bumble', 'skype',
        'zoom', 'line', 'signal', 'viber',
        'google+', 'livejournal', 'xanga', 'friendster',
        'aol', 'msn', 'ymail', 'hotmail',
        'facebook_', 'twitter_', 'instagram_', 'linkedin_',
        'tiktok_', 'snapchat_', 'pinterest_', 'reddit_',
        'tumblr_', 'youtube_', 'whatsapp_', 'wechat_',
        'telegram_', 'discord_', 'slack_', 'quora_',
        'flickr_', 'vk_', 'dailymotion_', 'mix_',
        'myspace_', 'periscope_', 'tumblr_', 'soundcloud_',
        'twitch_', 'foursquare_', 'yelp_', 'meetup_',
        'gab_', 'parler_', 'ello_', 'clubhouse_',
        'reddit_', 'badoo_', 'okcupid_', 'match_',
        'happn_', 'tinder_', 'bumble_', 'skype_',
        'zoom_', 'line_', 'signal_', 'viber_',
        'google+_', 'livejournal_', 'xanga_', 'friendster_',
        'aol_', 'msn_', 'ymail_', 'hotmail_',
        'facebook', 'twitter', 'instagram', 'linkedin',
        'tiktok', 'snapchat', 'pinterest', 'reddit',
        'tumblr', 'youtube', 'whatsapp', 'wechat',
        'telegram', 'discord', 'slack', 'quora',
        'flickr', 'vk', 'dailymotion', 'mix',
        'myspace', 'periscope', 'soundcloud', 'twitch',
        'foursquare', 'yelp', 'meetup', 'gab',
        'parler', 'ello', 'clubhouse', 'badoo',
        'okcupid', 'match', 'happn', 'tinder',
        'bumble', 'skype', 'zoom', 'line',
        'signal', 'viber', 'google+', 'livejournal',
        'xanga', 'friendster', 'aol', 'msn',
        'ymail', 'hotmail'
    ]
    };

    // Combine all patterns into a single array
    const keywords = Object.values(patterns).flat();
    // Add general keywords
    keywords.push('\\.com', 'https', 'http', 'whatsapp', 'instagram', '&gmail\\.com', 'gmail');

    // Create regex patterns for search
    const regexPatterns = keywords.map(keyword => ({
      desc: { $regex: keyword, $options: 'i' } // 'i' for case-insensitive search
    }));
console.log("Here");
    // Search the database
    const sensitiveMessages = await Message.find({
      $or: regexPatterns
    }).sort({ createdAt: -1 });
    // Return the results
    res.status(201).json(sensitiveMessages);

    // st warned

  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({ message: 'Error searching messages', error });
  }
};

// module.exports = (socketIO) => {
//   io = socketIO; // Assign the Socket.IO instance to the local variable
//   return { createMessage, getMessages,searchSensitiveMessages };
// };


module.exports = { setSocketIO, createMessage, getMessages, searchSensitiveMessages };
