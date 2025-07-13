<?php
require_once '../../includes/header.php';
require_once '../../includes/sidebar.php';
require_once '../../includes/components.php';
require_once '../../includes/footer.php';

$titles = [
    'portfolio' => 'Portfolio Management - User Dashboard',
    'applications' => 'My Applications - User Dashboard', 
    'messages' => 'Messages - User Dashboard',
    'calendar' => 'Calendar - User Dashboard',
    'settings' => 'Settings - User Dashboard'
];

$pageNames = [
    'portfolio' => 'Portfolio Management',
    'applications' => 'My Applications',
    'messages' => 'Messages', 
    'calendar' => 'Calendar',
    'settings' => 'Settings'
];

$currentDir = basename(__DIR__);
echo renderHeader($titles[$currentDir], "Emma Johnson", "Fashion Model", "User");
?>

<style>
.messages-hero { 
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem 0;
    margin: -20px -20px 30px -20px;
}
.messages-container {
    display: flex;
    height: 600px;
    border: 1px solid #dee2e6;
    border-radius: 15px;
    overflow: hidden;
    background: white;
}
.conversations-sidebar {
    width: 350px;
    border-right: 1px solid #dee2e6;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
}
.conversation-item {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.conversation-item:hover {
    background: #e9ecef;
}
.conversation-item.active {
    background: #007bff;
    color: white;
}
.conversation-item.unread {
    background: #fff3cd;
    border-left: 3px solid #ffc107;
}
.conversation-item.unread.active {
    background: #007bff;
    border-left: 3px solid #0056b3;
}
.conversation-avatar {
    width: 45px;
    height: 45px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.conversation-content {
    flex: 1;
    min-width: 0;
}
.conversation-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.conversation-preview {
    font-size: 0.85rem;
    opacity: 0.8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.conversation-time {
    font-size: 0.75rem;
    opacity: 0.7;
    flex-shrink: 0;
}
.conversation-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
}
.unread-badge {
    background: #dc3545;
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: bold;
}
.chat-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}
.chat-header {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
    background: white;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.chat-header-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}
.chat-header-info {
    flex: 1;
}
.chat-header-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
}
.chat-header-status {
    font-size: 0.85rem;
    color: #6c757d;
}
.online-indicator {
    width: 8px;
    height: 8px;
    background: #28a745;
    border-radius: 50%;
    margin-left: 0.5rem;
}
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #f8f9fa;
}
.message {
    margin-bottom: 1rem;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
}
.message.sent {
    flex-direction: row-reverse;
}
.message-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
}
.message-content {
    max-width: 70%;
}
.message-bubble {
    padding: 0.75rem 1rem;
    border-radius: 18px;
    margin-bottom: 0.25rem;
    word-wrap: break-word;
}
.message.received .message-bubble {
    background: white;
    border: 1px solid #dee2e6;
    border-bottom-left-radius: 6px;
}
.message.sent .message-bubble {
    background: #007bff;
    color: white;
    border-bottom-right-radius: 6px;
}
.message-time {
    font-size: 0.75rem;
    color: #6c757d;
    margin: 0 0.5rem;
}
.message.sent .message-time {
    text-align: right;
}
/* File attachments */
.message-attachments {
    margin-top: 0.5rem;
}
.attachment-item {
    display: inline-block;
    margin: 0.25rem;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
}
.attachment-item:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}
.attachment-image {
    width: 200px;
    height: 150px;
    object-fit: cover;
    cursor: pointer;
}
.attachment-file {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #f8f9fa;
    border-radius: 8px;
    cursor: pointer;
    min-width: 200px;
}
.attachment-file:hover {
    background: #e9ecef;
}
.attachment-icon {
    width: 40px;
    height: 40px;
    margin-right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 8px;
    font-size: 1.25rem;
}
.attachment-file-info {
    flex: 1;
}
.attachment-filename {
    font-weight: 500;
    margin-bottom: 0.25rem;
    color: #212529;
}
.attachment-filesize {
    font-size: 0.75rem;
    color: #6c757d;
}
.file-icon-pdf { color: #dc3545; }
.file-icon-doc { color: #0056b3; }
.file-icon-xls { color: #28a745; }
.file-icon-zip { color: #6c757d; }
.file-icon-default { color: #6c757d; }
/* Multiple attachments grid */
.attachments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
}
/* File upload preview */
.upload-preview {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    z-index: 1000;
    max-width: 500px;
    width: 90%;
}
.upload-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}
.upload-preview-items {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    max-height: 200px;
    overflow-y: auto;
}
.upload-preview-item {
    position: relative;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 0.5rem;
}
.upload-preview-item img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 4px;
}
.upload-preview-remove {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.75rem;
}
/* File input styling */
.file-input-wrapper {
    position: relative;
    overflow: hidden;
    display: inline-block;
}
.file-input-wrapper input[type=file] {
    position: absolute;
    left: -9999px;
}
.chat-input {
    padding: 1rem;
    border-top: 1px solid #dee2e6;
    background: white;
}
.chat-input-area {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.chat-input-field {
    flex: 1;
    border: 1px solid #dee2e6;
    border-radius: 25px;
    padding: 0.75rem 1rem;
    resize: none;
    max-height: 100px;
}
.chat-input-field:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}
.chat-send-btn {
    background: #007bff;
    color: white;
    border: none;
    border-radius: 50%;
    width: 45px;
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
}
.chat-send-btn:hover {
    background: #0056b3;
    transform: scale(1.05);
}
.chat-send-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    transform: none;
}
.attachment-btn {
    background: none;
    border: none;
    color: #6c757d;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
}
.attachment-btn:hover {
    background: #e9ecef;
    color: #007bff;
}
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    color: #6c757d;
    font-style: italic;
    font-size: 0.85rem;
}
.typing-dots {
    display: flex;
    gap: 2px;
}
.typing-dot {
    width: 4px;
    height: 4px;
    background: #6c757d;
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}
.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing {
    0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}
.empty-chat {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6c757d;
    text-align: center;
    padding: 2rem;
}
.search-conversations {
    padding: 1rem;
    border-bottom: 1px solid #dee2e6;
}
.search-conversations input {
    width: 100%;
    border: 1px solid #dee2e6;
    border-radius: 25px;
    padding: 0.5rem 1rem;
}
.online-status {
    position: relative;
}
.online-status::after {
    content: '';
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 10px;
    height: 10px;
    background: #28a745;
    border: 2px solid white;
    border-radius: 50%;
}
.offline-status::after {
    background: #6c757d;
}
</style>

<div class="d-flex">
    <?php echo renderSidebar('User', getUserSidebarItems(), 'messages/index.php'); ?>
    
    <div class="main-content flex-grow-1">
        <?php 
        echo createBreadcrumb([
            ['label' => 'Dashboard', 'href' => '../index.php'],
            ['label' => 'Messages']
        ]);
        ?>
        
        <!-- Messages Hero Section -->
        <div class="messages-hero">
            <div class="container-fluid">
                <div class="row align-items-center">
                    <div class="col-md-8">
                        <h1 class="fw-bold mb-2">Messages</h1>
                        <p class="fs-5 mb-3">Communicate with clients, photographers, and industry professionals</p>
                    </div>
                    <div class="col-md-4 text-end">
                        <button class="btn btn-light btn-lg me-2" onclick="showNewMessageModal()">
                            <i class="fas fa-pen me-2"></i>New Message
                        </button>
                        <button class="btn btn-outline-light btn-lg" onclick="showContactsModal()">
                            <i class="fas fa-address-book me-2"></i>Contacts
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Messages Interface -->
        <div class="messages-container">
            <!-- Conversations Sidebar -->
            <div class="conversations-sidebar">
                <div class="search-conversations">
                    <input type="text" placeholder="Search conversations..." id="conversationSearch">
                </div>
                
                <div class="conversations-list" id="conversationsList">
                    <!-- Active Conversation -->
                    <div class="conversation-item active" data-conversation="1" onclick="loadConversation(1)">
                        <div class="online-status">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                                 class="conversation-avatar" alt="Marcus Rodriguez">
                        </div>
                        <div class="conversation-content">
                            <div class="conversation-meta">
                                <div class="conversation-name">Marcus Rodriguez</div>
                                <div class="conversation-time">2m</div>
                            </div>
                            <div class="conversation-preview">Sounds perfect! Let's schedule the...</div>
                        </div>
                    </div>

                    <!-- Unread Conversation -->
                    <div class="conversation-item unread" data-conversation="2" onclick="loadConversation(2)">
                        <div class="online-status">
                            <img src="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face" 
                                 class="conversation-avatar" alt="Sarah Mitchell">
                        </div>
                        <div class="conversation-content">
                            <div class="conversation-meta">
                                <div class="conversation-name">Sarah Mitchell</div>
                                <div class="conversation-time">1h</div>
                                <div class="unread-badge">3</div>
                            </div>
                            <div class="conversation-preview">We'd love to work with you on our...</div>
                        </div>
                    </div>

                    <!-- Regular Conversation -->
                    <div class="conversation-item" data-conversation="3" onclick="loadConversation(3)">
                        <div class="offline-status">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" 
                                 class="conversation-avatar" alt="David Thompson">
                        </div>
                        <div class="conversation-content">
                            <div class="conversation-meta">
                                <div class="conversation-name">David Thompson</div>
                                <div class="conversation-time">Yesterday</div>
                            </div>
                            <div class="conversation-preview">Thanks for the quick response...</div>
                        </div>
                    </div>

                    <!-- Agency Conversation -->
                    <div class="conversation-item" data-conversation="4" onclick="loadConversation(4)">
                        <div class="offline-status">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" 
                                 class="conversation-avatar" alt="Elite Models NYC">
                        </div>
                        <div class="conversation-content">
                            <div class="conversation-meta">
                                <div class="conversation-name">Elite Models NYC</div>
                                <div class="conversation-time">2 days</div>
                            </div>
                            <div class="conversation-preview">Your portfolio review is scheduled...</div>
                        </div>
                    </div>

                    <!-- Brand Conversation -->
                    <div class="conversation-item" data-conversation="5" onclick="loadConversation(5)">
                        <div class="offline-status">
                            <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face" 
                                 class="conversation-avatar" alt="Vogue Magazine">
                        </div>
                        <div class="conversation-content">
                            <div class="conversation-meta">
                                <div class="conversation-name">Vogue Magazine</div>
                                <div class="conversation-time">1 week</div>
                            </div>
                            <div class="conversation-preview">Congratulations on being selected...</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chat Area -->
            <div class="chat-area" id="chatArea">
                <!-- Chat Header -->
                <div class="chat-header">
                    <div class="online-status">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="chat-header-avatar" alt="Marcus Rodriguez">
                    </div>
                    <div class="chat-header-info">
                        <div class="chat-header-name">Marcus Rodriguez</div>
                        <div class="chat-header-status">
                            Online <span class="online-indicator"></span>
                        </div>
                    </div>
                    <div class="chat-header-actions">
                        <button class="btn btn-outline-secondary btn-sm me-2" onclick="showContactInfo()">
                            <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="showChatOptions()">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                </div>

                <!-- Chat Messages -->
                <div class="chat-messages" id="chatMessages">
                    <!-- Received Message -->
                    <div class="message received">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Marcus Rodriguez">
                        <div class="message-content">
                            <div class="message-bubble">
                                Hi Emma! I saw your portfolio and I'm really impressed with your fashion work. 
                                I'd love to discuss a collaboration opportunity with you.
                            </div>
                            <div class="message-time">Yesterday, 2:30 PM</div>
                        </div>
                    </div>

                    <!-- Sent Message -->
                    <div class="message sent">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Emma Johnson">
                        <div class="message-content">
                            <div class="message-bubble">
                                Hi Marcus! Thank you for reaching out. I'd definitely be interested 
                                in hearing more about the collaboration. What did you have in mind?
                            </div>
                            <div class="message-attachments">
                                <div class="attachments-grid">
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Portfolio shot 1" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Portfolio shot 2" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Portfolio shot 3" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('pdf', 'Emma_Johnson_Portfolio.pdf')">
                                            <div class="attachment-icon file-icon-pdf">
                                                <i class="fas fa-file-pdf"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Emma_Johnson_Portfolio.pdf</div>
                                                <div class="attachment-filesize">8.2 MB</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Yesterday, 3:45 PM</div>
                        </div>
                    </div>

                    <!-- Received Message -->
                    <div class="message received">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Marcus Rodriguez">
                        <div class="message-content">
                            <div class="message-bubble">
                                I'm working on a new editorial series for a high-end fashion magazine. 
                                The concept is modern elegance meets street style. Your aesthetic would be perfect for this project.
                            </div>
                            <div class="message-attachments">
                                <div class="attachments-grid">
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Fashion concept" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Editorial concept" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('pdf', 'Editorial_Concept_Board.pdf')">
                                            <div class="attachment-icon file-icon-pdf">
                                                <i class="fas fa-file-pdf"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Editorial_Concept_Board.pdf</div>
                                                <div class="attachment-filesize">2.4 MB</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Yesterday, 4:15 PM</div>
                        </div>
                    </div>

                    <div class="message received">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Marcus Rodriguez">
                        <div class="message-content">
                            <div class="message-bubble">
                                The shoot would be a 2-day project in Manhattan. We're looking at next month. 
                                Are you available to discuss the details further?
                            </div>
                            <div class="message-time">Yesterday, 4:16 PM</div>
                        </div>
                    </div>

                    <!-- Sent Message -->
                    <div class="message sent">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Emma Johnson">
                        <div class="message-content">
                            <div class="message-bubble">
                                That sounds amazing! I love the concept you described. Next month works well for me. 
                                Should we set up a call to go over the creative direction and logistics?
                            </div>
                            <div class="message-attachments">
                                <div class="attachments-grid">
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Recent work sample" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('doc', 'Availability_Calendar.docx')">
                                            <div class="attachment-icon file-icon-doc">
                                                <i class="fas fa-file-word"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Availability_Calendar.docx</div>
                                                <div class="attachment-filesize">124 KB</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('pdf', 'Rate_Sheet_2024.pdf')">
                                            <div class="attachment-icon file-icon-pdf">
                                                <i class="fas fa-file-pdf"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Rate_Sheet_2024.pdf</div>
                                                <div class="attachment-filesize">256 KB</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Today, 9:30 AM</div>
                        </div>
                    </div>

                    <!-- Received Message -->
                    <div class="message received">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Marcus Rodriguez">
                        <div class="message-content">
                            <div class="message-bubble">
                                Sounds perfect! Let's schedule the call for tomorrow afternoon if that works for you. 
                                I'll send over some mood boards and initial concepts before we chat.
                            </div>
                            <div class="message-attachments">
                                <div class="attachments-grid">
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('doc', 'Project_Brief.docx')">
                                            <div class="attachment-icon file-icon-doc">
                                                <i class="fas fa-file-word"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Project_Brief.docx</div>
                                                <div class="attachment-filesize">45 KB</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('xls', 'Schedule_Timeline.xlsx')">
                                            <div class="attachment-icon file-icon-xls">
                                                <i class="fas fa-file-excel"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Schedule_Timeline.xlsx</div>
                                                <div class="attachment-filesize">128 KB</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="attachment-item">
                                        <div class="attachment-file" onclick="viewAttachment('zip', 'Mood_Boards_Collection.zip')">
                                            <div class="attachment-icon file-icon-zip">
                                                <i class="fas fa-file-archive"></i>
                                            </div>
                                            <div class="attachment-file-info">
                                                <div class="attachment-filename">Mood_Boards_Collection.zip</div>
                                                <div class="attachment-filesize">15.7 MB</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Today, 11:45 AM</div>
                        </div>
                    </div>

                    <!-- Image-only message -->
                    <div class="message sent">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Emma Johnson">
                        <div class="message-content">
                            <div class="message-attachments">
                                <div class="attachments-grid">
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 1" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 2" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 3" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 4" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 5" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1200')">
                                    </div>
                                    <div class="attachment-item">
                                        <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop" 
                                             class="attachment-image" 
                                             alt="Behind the scenes 6" 
                                             onclick="viewAttachment('image', 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200')">
                                    </div>
                                </div>
                            </div>
                            <div class="message-time">Today, 12:15 PM</div>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div class="typing-indicator" id="typingIndicator" style="display: none;">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                             class="message-avatar" alt="Marcus Rodriguez">
                        <span>Marcus is typing</span>
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>

                <!-- Chat Input -->
                <div class="chat-input">
                    <div class="chat-input-area">
                        <div class="file-input-wrapper">
                            <button class="attachment-btn" onclick="document.getElementById('fileInput').click()">
                                <i class="fas fa-paperclip"></i>
                            </button>
                            <input type="file" id="fileInput" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" onchange="handleFileSelect(event)">
                        </div>
                        <textarea class="chat-input-field" id="messageInput" placeholder="Type your message..." 
                                  onkeypress="handleMessageInput(event)" oninput="handleTyping()"></textarea>
                        <button class="chat-send-btn" id="sendButton" onclick="sendMessage()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Upload Preview -->
<div class="upload-preview" id="uploadPreview" style="display: none;">
    <div class="upload-preview-header">
        <h6 class="mb-0">Files to send</h6>
        <button type="button" class="btn-close" onclick="clearUploadPreview()"></button>
    </div>
    <div class="upload-preview-items" id="uploadPreviewItems"></div>
    <div class="mt-3">
        <button class="btn btn-primary btn-sm" onclick="sendFilesWithMessage()">
            <i class="fas fa-paper-plane me-2"></i>Send with message
        </button>
        <button class="btn btn-secondary btn-sm" onclick="clearUploadPreview()">Cancel</button>
    </div>
</div>

<!-- New Message Modal -->
<div class="modal fade" id="newMessageModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">New Message</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <form id="newMessageForm">
                    <div class="mb-3">
                        <label class="form-label">To</label>
                        <input type="text" class="form-control" id="messageRecipient" 
                               placeholder="Enter contact name or email...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Subject</label>
                        <input type="text" class="form-control" id="messageSubject" 
                               placeholder="Enter message subject...">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Message</label>
                        <textarea class="form-control" id="messageBody" rows="5" 
                                  placeholder="Type your message..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" onclick="sendNewMessage()">
                    <i class="fas fa-paper-plane me-2"></i>Send Message
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Contacts Modal -->
<div class="modal fade" id="contactsModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Contacts</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <input type="text" class="form-control" placeholder="Search contacts..." id="contactSearch">
                </div>
                
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle me-3" width="50" height="50" alt="Marcus Rodriguez">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">Marcus Rodriguez</h6>
                                        <small class="text-muted">Photographer</small>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm" onclick="startConversation('marcus')">
                                        <i class="fas fa-comment"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle me-3" width="50" height="50" alt="Sarah Mitchell">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">Sarah Mitchell</h6>
                                        <small class="text-muted">Creative Director</small>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm" onclick="startConversation('sarah')">
                                        <i class="fas fa-comment"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle me-3" width="50" height="50" alt="David Thompson">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">David Thompson</h6>
                                        <small class="text-muted">Brand Manager</small>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm" onclick="startConversation('david')">
                                        <i class="fas fa-comment"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <div class="d-flex align-items-center">
                                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" 
                                         class="rounded-circle me-3" width="50" height="50" alt="Elite Models NYC">
                                    <div class="flex-grow-1">
                                        <h6 class="mb-1">Elite Models NYC</h6>
                                        <small class="text-muted">Modeling Agency</small>
                                    </div>
                                    <button class="btn btn-outline-primary btn-sm" onclick="startConversation('elite')">
                                        <i class="fas fa-comment"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Messages functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMessages();
});

let currentConversation = 1;
let typingTimeout = null;
let selectedFiles = [];

function initializeMessages() {
    // Load stored conversations
    loadStoredConversations();
    
    // Search conversations
    document.getElementById('conversationSearch').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        filterConversations(searchTerm);
    });

    // Auto-scroll chat to bottom
    scrollChatToBottom();
}

function loadStoredConversations() {
    const conversations = window.demoStorage.get('conversations') || [];
    
    if (conversations.length > 0) {
        // Update conversation list in sidebar
        const conversationsList = document.querySelector('.conversations-list');
        if (conversationsList) {
            // Clear existing conversations
            conversationsList.innerHTML = '';
            
            // Add conversations from storage
            conversations.forEach(conv => {
                const convElement = createConversationElement(conv);
                conversationsList.appendChild(convElement);
            });
        }
        
        // Load first conversation by default
        loadConversation(conversations[0].id);
    }
}

function createConversationElement(conv) {
    const div = document.createElement('div');
    div.className = `conversation-item d-flex align-items-center p-3 ${conv.unread ? 'unread' : ''}`;
    div.setAttribute('data-conversation', conv.id);
    div.onclick = () => loadConversation(conv.id);
    
    div.innerHTML = `
        <img src="${conv.avatar}" class="rounded-circle me-3" width="50" height="50" alt="${conv.name}">
        <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-center">
                <h6 class="conversation-name mb-1">${conv.name}</h6>
                <small class="conversation-time text-muted">${conv.lastMessageTime}</small>
            </div>
            <p class="conversation-preview text-muted mb-0">${conv.lastMessage}</p>
            <small class="text-muted">${conv.role}</small>
        </div>
        ${conv.unread ? '<div class="unread-indicator"></div>' : ''}
    `;
    
    return div;
}

function loadConversation(conversationId) {
    // Remove active class from all conversations
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected conversation
    document.querySelector(`[data-conversation="${conversationId}"]`).classList.add('active');
    
    // Remove unread indicator
    document.querySelector(`[data-conversation="${conversationId}"]`).classList.remove('unread');
    
    currentConversation = conversationId;
    
    // Load conversation data (in real app, this would be an API call)
    loadConversationData(conversationId);
    
    // Scroll to bottom
    setTimeout(scrollChatToBottom, 100);
}

function loadConversationData(conversationId) {
    // Load conversation data from storage
    const conversations = window.demoStorage.get('conversations') || [];
    const conv = conversations.find(c => c.id === conversationId);
    
    if (conv) {
        // Update chat header
        document.querySelector('.chat-header-name').textContent = conv.name;
        document.querySelector('.chat-header-status').innerHTML = conv.status + (conv.status === 'Online' ? ' <span class="online-indicator"></span>' : '');
        document.querySelector('.chat-header-avatar').src = conv.avatar;
        
        // Load messages
        loadMessagesForConversation(conv);
    }
}

function loadMessagesForConversation(conv) {
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Clear existing messages (except typing indicator)
    const messages = chatMessages.querySelectorAll('.message');
    messages.forEach(msg => msg.remove());
    
    // Add messages from conversation
    if (conv.messages && conv.messages.length > 0) {
        conv.messages.forEach(message => {
            const messageDiv = createMessageElement(message, conv);
            chatMessages.insertBefore(messageDiv, typingIndicator);
        });
    }
    
    // Scroll to bottom
    setTimeout(() => scrollChatToBottom(), 100);
}

function createMessageElement(message, conv) {
    const messageDiv = document.createElement('div');
    const isFromEmma = message.sender === 'emma';
    messageDiv.className = `message ${isFromEmma ? 'sent' : 'received'}`;
    
    const avatar = isFromEmma ? 
        'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face' : 
        conv.avatar;
    
    const time = new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const date = new Date(message.timestamp).toLocaleDateString() === new Date().toLocaleDateString() ? 
        'Today' : new Date(message.timestamp).toLocaleDateString();
    
    let attachmentsHtml = '';
    if (message.attachments && message.attachments.length > 0) {
        attachmentsHtml = '<div class="message-attachments"><div class="attachments-grid">';
        message.attachments.forEach(attachment => {
            if (attachment.type === 'image') {
                attachmentsHtml += `
                    <div class="attachment-item">
                        <img src="${attachment.url}" 
                             class="attachment-image" 
                             alt="${attachment.name}" 
                             onclick="viewAttachment('image', '${attachment.url}')">
                    </div>
                `;
            } else {
                const icon = getFileIcon(attachment.name);
                attachmentsHtml += `
                    <div class="attachment-item">
                        <div class="attachment-file" onclick="viewAttachment('file', '${attachment.name}')">
                            <div class="attachment-icon ${icon.class}">
                                <i class="${icon.icon}"></i>
                            </div>
                            <div class="attachment-file-info">
                                <div class="attachment-filename">${attachment.name}</div>
                                <div class="attachment-filesize">${attachment.size}</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        attachmentsHtml += '</div></div>';
    }
    
    messageDiv.innerHTML = `
        <img src="${avatar}" class="message-avatar" alt="${isFromEmma ? 'Emma Johnson' : conv.name}">
        <div class="message-content">
            ${message.content ? `<div class="message-bubble">${message.content}</div>` : ''}
            ${attachmentsHtml}
            <div class="message-time">${date}, ${time}</div>
        </div>
    `;
    
    return messageDiv;
}

function filterConversations(searchTerm) {
    const conversations = document.querySelectorAll('.conversation-item');
    
    conversations.forEach(conv => {
        const name = conv.querySelector('.conversation-name').textContent.toLowerCase();
        const preview = conv.querySelector('.conversation-preview').textContent.toLowerCase();
        
        if (name.includes(searchTerm) || preview.includes(searchTerm)) {
            conv.style.display = 'flex';
        } else {
            conv.style.display = 'none';
        }
    });
}

function handleMessageInput(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleTyping() {
    // Simulate typing indicator for other user
    const indicator = document.getElementById('typingIndicator');
    
    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    // Show typing indicator briefly
    indicator.style.display = 'flex';
    
    // Hide after 2 seconds of no typing
    typingTimeout = setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Save message to storage
    const saved = window.demoStorage.addMessage(currentConversation, message);
    
    if (saved) {
        // Reload conversation to show new message
        const conversations = window.demoStorage.get('conversations') || [];
        const conv = conversations.find(c => c.id === currentConversation);
        
        if (conv) {
            // Create message element
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            
            const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            messageDiv.innerHTML = `
                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
                     class="message-avatar" alt="Emma Johnson">
                <div class="message-content">
                    <div class="message-bubble">${message}</div>
                    <div class="message-time">Today, ${currentTime}</div>
                </div>
            `;
            
            // Add to chat
            const chatMessages = document.getElementById('chatMessages');
            const typingIndicator = document.getElementById('typingIndicator');
            chatMessages.insertBefore(messageDiv, typingIndicator);
            
            // Update conversation preview in sidebar
            updateConversationPreview(message);
        }
    }
    
    // Clear input
    messageInput.value = '';
    
    // Scroll to bottom
    scrollChatToBottom();
    
    // Simulate response after a delay
    setTimeout(() => {
        simulateResponse();
    }, 1500);
}

function simulateResponse() {
    const responses = [
        "That sounds great! I'll get back to you shortly.",
        "Perfect! Let me check my schedule and confirm.",
        "Absolutely! I'll send over those details today.",
        "Thanks for the update. Looking forward to working together!",
        "Got it! I'll prepare everything for our meeting."
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received';
    
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" 
             class="message-avatar" alt="Marcus Rodriguez">
        <div class="message-content">
            <div class="message-bubble">${randomResponse}</div>
            <div class="message-time">Today, ${currentTime}</div>
        </div>
    `;
    
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    chatMessages.insertBefore(messageDiv, typingIndicator);
    
    scrollChatToBottom();
}

function updateConversationPreview(message) {
    const activeConv = document.querySelector('.conversation-item.active');
    if (activeConv) {
        const preview = activeConv.querySelector('.conversation-preview');
        const time = activeConv.querySelector('.conversation-time');
        
        preview.textContent = message.length > 30 ? message.substring(0, 30) + '...' : message;
        time.textContent = 'now';
    }
}

function scrollChatToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNewMessageModal() {
    const modal = new bootstrap.Modal(document.getElementById('newMessageModal'));
    modal.show();
}

function showContactsModal() {
    const modal = new bootstrap.Modal(document.getElementById('contactsModal'));
    modal.show();
}

function sendNewMessage() {
    const recipient = document.getElementById('messageRecipient').value;
    const subject = document.getElementById('messageSubject').value;
    const body = document.getElementById('messageBody').value;
    
    if (!recipient || !body) {
        showToast('Please fill in recipient and message fields', 'warning');
        return;
    }
    
    // Simulate sending message
    const modal = bootstrap.Modal.getInstance(document.getElementById('newMessageModal'));
    modal.hide();
    
    showToast('Message sent successfully!', 'success');
    
    // Reset form
    document.getElementById('newMessageForm').reset();
}

function startConversation(contactId) {
    // Simulate starting a new conversation
    showToast(`Starting conversation with ${contactId}...`, 'info');
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('contactsModal'));
    modal.hide();
}

function showContactInfo() {
    showToast('Contact information panel would open', 'info');
}

function showChatOptions() {
    showToast('Chat options menu would appear', 'info');
}

function showAttachmentOptions() {
    document.getElementById('fileInput').click();
}

// File handling functions
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    selectedFiles = selectedFiles.concat(files);
    showUploadPreview();
    
    // Reset file input
    event.target.value = '';
}

function showUploadPreview() {
    const preview = document.getElementById('uploadPreview');
    const previewItems = document.getElementById('uploadPreviewItems');
    
    previewItems.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = 'upload-preview-item';
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="upload-preview-remove" onclick="removeSelectedFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            const icon = getFileIcon(file.name);
            item.innerHTML = `
                <div class="attachment-file" style="min-width: auto;">
                    <div class="attachment-icon ${icon.class}">
                        <i class="${icon.icon}"></i>
                    </div>
                    <div class="attachment-file-info">
                        <div class="attachment-filename">${file.name}</div>
                        <div class="attachment-filesize">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="upload-preview-remove" onclick="removeSelectedFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
        }
        
        previewItems.appendChild(item);
    });
    
    preview.style.display = 'block';
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
        clearUploadPreview();
    } else {
        showUploadPreview();
    }
}

function clearUploadPreview() {
    selectedFiles = [];
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadPreviewItems').innerHTML = '';
}

function sendFilesWithMessage() {
    if (selectedFiles.length === 0) return;
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim() || 'Sent files';
    
    // Create message with attachments
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    
    const currentTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    let attachmentsHtml = '<div class="message-attachments"><div class="attachments-grid">';
    
    selectedFiles.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                attachmentsHtml += `
                    <div class="attachment-item">
                        <img src="${e.target.result}" 
                             class="attachment-image" 
                             alt="${file.name}" 
                             onclick="viewAttachment('image', '${e.target.result}')">
                    </div>
                `;
            };
            reader.readAsDataURL(file);
        } else {
            const icon = getFileIcon(file.name);
            attachmentsHtml += `
                <div class="attachment-item">
                    <div class="attachment-file" onclick="viewAttachment('file', '${file.name}')">
                        <div class="attachment-icon ${icon.class}">
                            <i class="${icon.icon}"></i>
                        </div>
                        <div class="attachment-file-info">
                            <div class="attachment-filename">${file.name}</div>
                            <div class="attachment-filesize">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                </div>
            `;
        }
    });
    
    attachmentsHtml += '</div></div>';
    
    messageDiv.innerHTML = `
        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=100&h=100&fit=crop&crop=face" 
             class="message-avatar" alt="Emma Johnson">
        <div class="message-content">
            ${message ? `<div class="message-bubble">${message}</div>` : ''}
            ${attachmentsHtml}
            <div class="message-time">Today, ${currentTime}</div>
        </div>
    `;
    
    // Add to chat
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    chatMessages.insertBefore(messageDiv, typingIndicator);
    
    // Clear input and files
    messageInput.value = '';
    clearUploadPreview();
    
    // Update conversation preview
    updateConversationPreview(message + ' [Files attached]');
    
    // Scroll to bottom
    scrollChatToBottom();
    
    // Show success toast
    showToast(`Sent ${selectedFiles.length} file(s)`, 'success');
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': { icon: 'fas fa-file-pdf', class: 'file-icon-pdf' },
        'doc': { icon: 'fas fa-file-word', class: 'file-icon-doc' },
        'docx': { icon: 'fas fa-file-word', class: 'file-icon-doc' },
        'xls': { icon: 'fas fa-file-excel', class: 'file-icon-xls' },
        'xlsx': { icon: 'fas fa-file-excel', class: 'file-icon-xls' },
        'zip': { icon: 'fas fa-file-archive', class: 'file-icon-zip' },
        'rar': { icon: 'fas fa-file-archive', class: 'file-icon-zip' }
    };
    
    return iconMap[ext] || { icon: 'fas fa-file', class: 'file-icon-default' };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function viewAttachment(type, src) {
    if (type === 'image') {
        // Open image in modal or new tab
        window.open(src, '_blank');
    } else {
        showToast(`Opening ${src}...`, 'info');
    }
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 3000);
}

// Simulate online status updates
setInterval(() => {
    // Randomly show/hide typing indicator
    if (Math.random() < 0.1) { // 10% chance every 5 seconds
        const indicator = document.getElementById('typingIndicator');
        indicator.style.display = 'flex';
        setTimeout(() => {
            indicator.style.display = 'none';
        }, 3000);
    }
}, 5000);
</script>

<!-- Include Demo Storage Utility -->
<script src="../../includes/demo-storage.js"></script>

<?php echo renderFooter(); ?>