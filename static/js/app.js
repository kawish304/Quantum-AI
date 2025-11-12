
    class SiliconBaapAI {
        constructor() {
            this.currentFeature = 'chat';
            this.currentModel = 'llama-3.3-70b-versatile';
            this.isProcessing = false;
            this.sessionId = this.generateSessionId();
            this.conversationHistory = [];
            this.init();
        }
        generateSessionId() { return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9); }
        init() { this.bindEvents(); this.loadConversationHistory(); this.updateUI(); }
        bindEvents() {
            document.querySelectorAll('.feature-btn').forEach(btn => { btn.addEventListener('click', (e) => { this.setCurrentFeature(e.currentTarget.dataset.feature); }); });
            document.querySelectorAll('.feature-card').forEach(card => { card.addEventListener('click', (e) => { this.setCurrentFeature(e.currentTarget.dataset.feature); }); });
            document.getElementById('modelSelect').addEventListener('change', (e) => { this.currentModel = e.target.value; this.showNotification('Model changed to: ' + e.target.selectedOptions[0].text, 'info'); });
            document.getElementById('sendBtn').addEventListener('click', () => { this.processMessage(); });
            document.getElementById('messageInput').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.processMessage(); } });
            document.getElementById('fileUpload').addEventListener('change', (e) => { this.handleFileUpload(e.target.files[0]); });
            document.getElementById('clearChat').addEventListener('click', () => { this.clearConversation(); });
            document.getElementById('featureSearch').addEventListener('input', (e) => { this.searchFeatures(e.target.value); });
            const textarea = document.getElementById('messageInput'); textarea.addEventListener('input', function() { this.style.height = 'auto'; this.style.height = Math.min(this.scrollHeight, 120) + 'px'; });
        }
        setCurrentFeature(feature) {
            this.currentFeature = feature;
            document.querySelectorAll('.feature-btn').forEach(btn => { btn.classList.remove('active'); });
            document.querySelector('[data-feature="' + feature + '"]')?.classList.add('active');
            const featureName = this.getFeatureName(feature);
            document.getElementById('currentFeature').textContent = featureName;
            this.showNotification('Feature activated: ' + featureName, 'success');
        }
        async processMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) { this.showNotification('Please enter a message', 'error'); return; }
            if (this.isProcessing) { this.showNotification('Please wait for the current request to complete', 'warning'); return; }
            this.addMessageToUI('user', message, this.currentFeature);
            input.value = ''; input.style.height = 'auto';
            this.showTypingIndicator(); this.isProcessing = true; this.updateSendButton();
            try {
                const response = await this.apiCall('/api/chat', {
                    feature: this.currentFeature,
                    message: message,
                    model: this.currentModel,
                    session_id: this.sessionId
                });
                if (response && response.status === 'success') {
                    this.hideTypingIndicator();
                    this.addMessageToUI('ai', response.response, this.currentFeature, response.model, response.detected_language, response.detected_domain);
                    this.saveToHistory('user', message, this.currentFeature);
                    this.saveToHistory('ai', response.response, this.currentFeature, response.model);
                } else {
                    throw new Error(response?.error || 'Unknown error occurred');
                }
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessageToUI('ai', '❌ Error: ' + error.message, this.currentFeature);
                this.showNotification('Error: ' + error.message, 'error');
            } finally {
                this.isProcessing = false;
                this.updateSendButton();
            }
        }
        async handleFileUpload(file) {
            if (!file) return;
            if (!this.currentFeature) { this.showNotification('Please select a feature first', 'error'); return; }
            const allowedTypes = ['pdf', 'txt', 'docx', 'csv', 'zip'];
            const fileType = file.name.split('.').pop().toLowerCase();
            if (!allowedTypes.includes(fileType)) { this.showNotification('File type not supported', 'error'); return; }
            this.isProcessing = true; this.updateSendButton(); this.showTypingIndicator();
            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('feature', this.currentFeature);
                formData.append('session_id', this.sessionId);
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                if (!response.ok) { throw new Error(await response.text()); }
                const data = await response.json(); this.hideTypingIndicator();
                if (data.status === 'success') {
                    this.addMessageToUI('user', '📁 Uploaded file: ' + file.name, this.currentFeature);
                    this.addMessageToUI('ai', data.response, this.currentFeature, data.model, data.detected_language, data.detected_domain);
                    this.saveToHistory('user', 'Uploaded file: ' + file.name, this.currentFeature);
                    this.saveToHistory('ai', data.response, this.currentFeature, data.model);
                }
            } catch (error) {
                this.hideTypingIndicator();
                this.addMessageToUI('ai', '❌ Upload error: ' + error.message, this.currentFeature);
                this.showNotification('Upload error: ' + error.message, 'error');
            } finally {
                this.isProcessing = false;
                this.updateSendButton();
                document.getElementById('fileUpload').value = '';
            }
        }
        addMessageToUI(sender, message, feature, model = null, detectedLanguage = null, detectedDomain = null) {
            const messagesContainer = document.getElementById('messagesContainer');
            const welcomeMessage = document.getElementById('welcomeMessage');
            if (welcomeMessage) { welcomeMessage.style.display = 'none'; }
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + sender + '-message';
            const header = document.createElement('div');
            header.className = 'message-header';
            if (sender === 'ai') {
                header.innerHTML = '<span class="feature-badge">' + this.getFeatureEmoji(feature) + ' ' + this.getFeatureName(feature) + '</span>' +
                                 (model ? '<span class="model-badge">' + model + '</span>' : '') +
                                 '<span class="power-level">💯 ULTIMATE</span>' +
                                 '<span class="time">' + new Date().toLocaleTimeString() + '</span>';
            } else {
                header.innerHTML = '<span class="user-badge">👤 You</span><span class="time">' + new Date().toLocaleTimeString() + '</span>';
            }
            const content = document.createElement('div');
            content.className = 'message-content';
            content.textContent = message;
            messageDiv.appendChild(header);
            messageDiv.appendChild(content);
            if (sender === 'ai' && (detectedLanguage || detectedDomain)) {
                const detectionInfo = document.createElement('div');
                detectionInfo.className = 'detection-info';
                if (detectedLanguage) {
                    detectionInfo.innerHTML += '<span class="detection-badge">' + detectedLanguage + '</span>';
                }
                if (detectedDomain) {
                    detectionInfo.innerHTML += '<span class="detection-badge">' + detectedDomain + '</span>';
                }
                messageDiv.appendChild(detectionInfo);
            }
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        showTypingIndicator() {
            const messagesContainer = document.getElementById('messagesContainer');
            const typingDiv = document.createElement('div');
            typingDiv.id = 'typingIndicator';
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = '<div class="message-header"><span class="feature-badge">' + this.getFeatureEmoji(this.currentFeature) + ' ' + this.getFeatureName(this.currentFeature) + '</span><span class="model-badge">' + this.getModelName(this.currentModel) + '</span><span class="power-level">💯 ULTIMATE</span></div><div class="typing-dots"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
            messagesContainer.appendChild(typingDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        hideTypingIndicator() { const typingIndicator = document.getElementById('typingIndicator'); if (typingIndicator) { typingIndicator.remove(); } }
        updateSendButton() {
            const btn = document.getElementById('sendBtn');
            if (this.isProcessing) { btn.innerHTML = '🔄 Processing...'; btn.disabled = true; }
            else { btn.innerHTML = '🚀 Send'; btn.disabled = false; }
        }
        clearConversation() {
            const messagesContainer = document.getElementById('messagesContainer');
            messagesContainer.innerHTML = '<div class="welcome-message" id="welcomeMessage"><div class="welcome-title">🚀 Welcome to Silicon Valley Ka Baap AI</div><div class="welcome-subtitle">The Most Advanced AI System - GPT-5 Ka Baap, Grok Ka Baap, All Models Ka Baap! Created by Syed Kawish Ali from Karachi, Pakistan (kawish.alisas@gmail.com)</div><div class="feature-grid"><div class="feature-card" data-feature="chat"><div class="feature-emoji">💬</div><div class="feature-name">AI Chat</div></div><div class="feature-card" data-feature="autonomous_mode"><div class="feature-emoji">🤖</div><div class="feature-name">Autonomous AI</div></div><div class="feature-card" data-feature="code_analyzer"><div class="feature-emoji">🧠</div><div class="feature-name">Code Analysis</div></div><div class="feature-card" data-feature="file_reader"><div class="feature-emoji">📁</div><div class="feature-name">File Reader</div></div></div></div>';
            document.querySelectorAll('.feature-card').forEach(card => { card.addEventListener('click', (e) => { this.setCurrentFeature(e.currentTarget.dataset.feature); }); });
            this.conversationHistory = []; this.sessionId = this.generateSessionId(); this.showNotification('Conversation cleared', 'info');
        }
        searchFeatures(query) {
            const features = document.querySelectorAll('.feature-btn');
            features.forEach(feature => {
                const featureName = feature.textContent.toLowerCase();
                if (featureName.includes(query.toLowerCase())) {
                    feature.style.display = 'flex';
                } else {
                    feature.style.display = 'none';
                }
            });
        }
        getFeatureEmoji(feature) {
            const features = {
                'chat': '💬', 'autonomous_mode': '🤖', 'quantum_chat': '🚀', 'code_analyzer': '🧠', 'code_genius': '💻',
                'web_dev_master': '🌐', 'bug_detector': '🐛', 'data_analyzer': '📊', 'data_science_pro': '🔬',
                'summary_maker': '📝', 'idea_generator': '💡', 'content_creator': '✍️', 'file_reader': '📁',
                'web_scraper': '🌐', 'text_translator': '🔤', 'security_scanner': '🔐', 'quantum_search': '🪐',
                'multi_model_chat': '🔄', 'quantum_mode': '⚡', 'ai_research': '🤖', 'quantum_computing': '⚛️',
                'blockchain_expert': '⛓️', 'cyber_security': '🛡️', 'cloud_architect': '☁️', 'startup_advisor': '🚀',
                'business_strategy': '📈', 'financial_analysis': '💹', 'marketing_genius': '📢', 'sales_optimizer': '💰',
                'video_producer': '🎥', 'music_composer': '🎵', 'game_developer': '🎮', 'ui_ux_designer': '🎨',
                'scientific_research': '🧪', 'medical_expert': '🏥', 'engineering_pro': '⚙️', 'math_genius': '🧮',
                'physics_expert': '🌌', 'multilingual_expert': '🌐', 'legal_advisor': '⚖️', 'education_tutor': '🎓',
                'travel_guide': '✈️', 'cooking_chef': '👨‍🍳', 'sentiment_analysis': '😊', 'api_generator': '🔌',
                'economic_analysis': '💰', 'historian_research': '📚', 'dr_ai_diagnosis': '🩺', 'system_status': '📈',
                'code_review': '👨‍💻', 'performance_optimizer': '⚡', 'code_translator': '🔄', 'document_analyzer': '📑',
                'presentation_maker': '📽️', 'email_writer': '✉️', 'resume_builder': '📄', 'interview_prep': '🎯',
                'learning_plan': '🎓', 'project_planner': '📅', 'business_plan': '💼', 'market_analysis': '📈',
                'competitor_analysis': '🔍', 'social_media_manager': '📱', 'seo_optimizer': '🔍', 'content_strategy': '📝',
                'brand_identity': '🎨', 'logo_designer': '⚡', 'color_palette': '🎨', 'font_pairing': '🔤',
                'ui_components': '🧩', 'api_documentation': '📖', 'database_design': '🗄️', 'system_architecture': '🏗️',
                'devops_pipeline': '🔄', 'cloud_deployment': '☁️', 'security_audit': '🔒', 'performance_testing': '⚡',
                'load_testing': '📊', 'api_testing': '🧪', 'unit_test_generator': '✅', 'integration_testing': '🔗',
                'zip_extractor': '🗃️', 'plugin_loader': '🧩'
            };
            return features[feature] || '🎯';
        }
        getFeatureName(feature) {
            const features = {
                'chat': 'AI Chat', 'autonomous_mode': 'Autonomous AI', 'quantum_chat': 'Quantum Chat',
                'code_analyzer': 'Code Analysis', 'code_genius': 'Code Genius', 'web_dev_master': 'Web Dev',
                'bug_detector': 'Bug Detector', 'data_analyzer': 'Data Analysis', 'data_science_pro': 'Data Science',
                'summary_maker': 'Summarizer', 'idea_generator': 'Idea Generator', 'content_creator': 'Content Creator',
                'file_reader': 'File Reader', 'web_scraper': 'Web Scraper', 'text_translator': 'Translator',
                'security_scanner': 'Security Scanner', 'quantum_search': 'Quantum Search',
                'multi_model_chat': 'Multi-Model Chat', 'quantum_mode': 'Quantum Mode', 'ai_research': 'AI Research',
                'quantum_computing': 'Quantum Computing', 'blockchain_expert': 'Blockchain', 'cyber_security': 'Cyber Security',
                'cloud_architect': 'Cloud Architect', 'startup_advisor': 'Startup Advisor', 'business_strategy': 'Business Strategy',
                'financial_analysis': 'Financial Analysis', 'marketing_genius': 'Marketing', 'sales_optimizer': 'Sales Optimizer',
                'video_producer': 'Video Producer', 'music_composer': 'Music Composer', 'game_developer': 'Game Developer',
                'ui_ux_designer': 'UI/UX Designer', 'scientific_research': 'Scientific Research', 'medical_expert': 'Medical Expert',
                'engineering_pro': 'Engineering Pro', 'math_genius': 'Math Genius', 'physics_expert': 'Physics Expert',
                'multilingual_expert': 'Multilingual Expert', 'legal_advisor': 'Legal Advisor', 'education_tutor': 'Education Tutor',
                'travel_guide': 'Travel Guide', 'cooking_chef': 'Cooking Chef', 'sentiment_analysis': 'Sentiment Analysis',
                'api_generator': 'API Generator', 'economic_analysis': 'Economic Analysis', 'historian_research': 'Historical Research',
                'dr_ai_diagnosis': 'Medical Analysis', 'system_status': 'System Status', 'code_review': 'Code Review',
                'performance_optimizer': 'Performance Optimizer', 'code_translator': 'Code Translator', 'document_analyzer': 'Document Analyzer',
                'presentation_maker': 'Presentation Maker', 'email_writer': 'Email Writer', 'resume_builder': 'Resume Builder',
                'interview_prep': 'Interview Preparation', 'learning_plan': 'Learning Plan', 'project_planner': 'Project Planner',
                'business_plan': 'Business Plan', 'market_analysis': 'Market Analysis', 'competitor_analysis': 'Competitor Analysis',
                'social_media_manager': 'Social Media Manager', 'seo_optimizer': 'SEO Optimizer', 'content_strategy': 'Content Strategy',
                'brand_identity': 'Brand Identity', 'logo_designer': 'Logo Designer', 'color_palette': 'Color Palette',
                'font_pairing': 'Font Pairing', 'ui_components': 'UI Components', 'api_documentation': 'API Documentation',
                'database_design': 'Database Design', 'system_architecture': 'System Architecture', 'devops_pipeline': 'DevOps Pipeline',
                'cloud_deployment': 'Cloud Deployment', 'security_audit': 'Security Audit', 'performance_testing': 'Performance Testing',
                'load_testing': 'Load Testing', 'api_testing': 'API Testing', 'unit_test_generator': 'Unit Test Generator',
                'integration_testing': 'Integration Testing', 'zip_extractor': 'ZIP Extractor', 'plugin_loader': 'Plugin Loader'
            };
            return features[feature] || feature;
        }
        getModelName(model) {
            const models = {
                'llama-3.3-70b-versatile': '🦙 Llama 3.3 70B',
                'llama-3.1-8b-instant': '⚡ Llama 3.1 8B Instant',
                'qwen/qwen3-32b': '🎯 Qwen 3 32B',
                'openai/gpt-oss-20b': '💎 GPT OSS 20B'
            };
            return models[model] || model;
        }
        async apiCall(endpoint, data) {
            const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!response.ok) { throw new Error(await response.text()); }
            return await response.json();
        }
        saveToHistory(sender, message, feature, model = null) {
            this.conversationHistory.push({ sender: sender, message: message, feature: feature, model: model, timestamp: new Date().toISOString() });
            if (this.conversationHistory.length > 100) { this.conversationHistory = this.conversationHistory.slice(-100); }
        }
        loadConversationHistory() { const saved = localStorage.getItem('conversation_' + this.sessionId); if (saved) { this.conversationHistory = JSON.parse(saved); } }
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = 'position:fixed; top:20px; right:20px; padding:12px 16px; border-radius:8px; color:white; font-weight:600; z-index:1000; animation:slideIn 0.3s ease;';
            notification.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => { notification.remove(); }, 3000);
        }
        updateUI() { this.setCurrentFeature(this.currentFeature); this.updateSendButton(); }
    }
    document.addEventListener('DOMContentLoaded', function() { window.siliconBaap = new SiliconBaapAI(); });
    