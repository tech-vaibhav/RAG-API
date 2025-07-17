import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;

  created_at?: string;  // ISO string from FastAPI
  sender?: string;      // "user" or "assistant"

}

interface Chat {
  id: string;
  title: string;
  isActive: boolean;
  lastMessage?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  currentMessage: string = '';
  messages: Message[] = [];
  chats: Chat[] = [];
  currentUser = '';
  isLoading = false;
  
  // Backend configuration
  private apiUrl = 'http://localhost:8000'; // FastAPI default port
  private token: string | null = null;  // ✅ safe declaration only // Get JWT token

  constructor(private http: HttpClient) {}

    ngOnInit() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('username');
      if (storedUser) {
        this.currentUser = storedUser;
      }
    }

    this.checkAuthentication();
    this.initializeChats(); // this can stay if it also uses SSR-safe checks
  }


  checkAuthentication() {
  if (typeof window !== 'undefined') {
    this.token = localStorage.getItem('token'); // ✅ fixed
    const storedUser = localStorage.getItem('username');
    this.currentUser = storedUser ?? 'Guest';

    if (!this.token) {
      console.warn('No authentication token found');
      // Optionally redirect to login page
      // this.router.navigate(['/login']);
    }
  } else {
    console.warn('Running in SSR - localStorage not available');
    this.currentUser = 'Guest';
  }
}



  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  getActiveChatId(): string {
  const active = this.chats.find(chat => chat.isActive);
  return active ? active.id : '';
}


  initializeChats() {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });

    this.http.get<any[]>(`${this.apiUrl}/conversations/`, { headers }).subscribe({
      next: (data) => {
        this.chats = data.map((conv: any) => ({
          id: conv.id,
          title: `Chat ${conv.id}`,
          isActive: false,
          lastMessage: 'Tap to view'
        }));
      },
      error: (err) => {
        console.error("Failed to load conversations:", err);
      }
    });
  }

  loadCurrentChat() {
  if (this.messages.length === 0) {
    const defaultMessage: Message = {
      id: this.generateId(),
      content: "Hello! I'm your RAG Assistant. I can help you find information and answer questions based on your knowledge base. You can also attach documents to enhance our conversation. What would you like to know?",
      timestamp: new Date(),
      isUser: false
    };

    this.messages.push(defaultMessage);

    // 🔄 Force Angular to detect change
    this.messages = [...this.messages];
    console.log('Default assistant message added:', defaultMessage);
  }
}


  showUserMenu: boolean = false;

  toggleUserMenu() {
  this.showUserMenu = !this.showUserMenu;
}

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
    window.location.href = '/login'; // Optional redirect
  }

  async sendMessage() {
    if (!this.currentMessage.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: this.generateId(),
      content: this.currentMessage,
      timestamp: new Date(),
      isUser: true
    };

    this.messages.push(userMessage);
    const messageContent = this.currentMessage;
    this.currentMessage = '';
    this.isLoading = true;

    try {
      // Call your actual backend API
      const aiResponse = await this.generateAIResponse(messageContent);
      
      const responseMessage: Message = {
        id: this.generateId(),
        content: aiResponse,
        timestamp: new Date(),
        isUser: false
      };
      
      this.messages.push(responseMessage);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback error message
      const errorMessage: Message = {
        id: this.generateId(),
        content: "I'm sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
        isUser: false
      };
      
      this.messages.push(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  async generateAIResponse(userMessage: string): Promise<string> {
    try {
      // Create FormData to match your FastAPI endpoint
      const formData = new FormData();
      formData.append('question', userMessage);
      formData.append('conversation_id', this.getActiveChatId());

      // Set up headers with JWT token if available
      let headers = new HttpHeaders();
      if (this.token) {
        headers = headers.set('Authorization', `Bearer ${this.token}`);
      }

      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/ask/`, formData, { headers })
      );
      
      // Your backend returns { "answer": "..." }
      return response.answer || 'No response received';
      
    } catch (error: any) {
      console.error('Backend API error:', error);
      
      // Handle specific error cases
      if (error.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please try again.');
      } else {
        throw new Error('Unable to process your question. Please try again later.');
      }
    }
  }

  startNewChat() {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });

    this.http.post<any>(`${this.apiUrl}/conversations/`, {}, { headers }).subscribe({
      next: (res) => {
        const newChat = {
          id: res.conversation_id,
          title: `Chat ${res.conversation_id}`,
          isActive: true,
          lastMessage: ''
        };

        this.chats.forEach(chat => chat.isActive = false);
        this.chats.unshift(newChat);
        this.messages = [];

        // Optional: greet user again on new chat
        this.loadCurrentChat();
      },
      error: (err) => {
        console.error("Failed to start new chat:", err);
      }
    });
  }


  selectChat(chatId: string) {
    this.chats.forEach(chat => {
      chat.isActive = chat.id === chatId;
    });

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.token}`
    });

    this.http.get<Message[]>(`${this.apiUrl}/conversations/${chatId}/messages/`, { headers }).subscribe({
      next: (data) => {
        this.messages = data.map(msg => ({
          id: msg.id || this.generateId(),
          content: msg.content,
          timestamp: new Date(msg.created_at || new Date()),
          isUser: msg.sender === 'user'
        }));

        // ✅ Add default assistant message if no messages
        if (this.messages.length === 0) {
          this.loadCurrentChat();
        }

        // ✅ Also update chat preview
        if (this.messages.length > 0) {
          const last = this.messages[this.messages.length - 1];
          const chat = this.chats.find(c => c.id === chatId);
          if (chat) {
            chat.lastMessage = last.content.slice(0, 50);
          }
        }
      },
      error: (err) => {
        console.error("Failed to load messages for chat:", err);
      }
    });
  }


  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  attachDocument() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.txt';
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        await this.uploadDocument(file);
      }
    };
    input.click();
  }

  async uploadDocument(file: File) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Set up headers with JWT token if available
      let headers = new HttpHeaders();
      if (this.token) {
        headers = headers.set('Authorization', `Bearer ${this.token}`);
      }

      // Show upload status message
      const uploadMessage: Message = {
        id: this.generateId(),
        content: `Uploading and processing document: ${file.name}...`,
        timestamp: new Date(),
        isUser: false
      };
      this.messages.push(uploadMessage);

      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/upload/`, formData, { headers })
      );

      // Update the upload message with success
      uploadMessage.content = `✅ Document "${file.name}" has been successfully uploaded and indexed. You can now ask questions about it!`;

    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update with error message
      const errorMessage: Message = {
        id: this.generateId(),
        content: `❌ Failed to upload document "${file.name}". Please try again.`,
        timestamp: new Date(),
        isUser: false
      };
      this.messages.push(errorMessage);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }
}