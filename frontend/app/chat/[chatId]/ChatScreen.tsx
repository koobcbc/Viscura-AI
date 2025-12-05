import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, Image, TouchableOpacity, Animated, Dimensions, ActionSheetIOS, Alert, TouchableWithoutFeedback, Keyboard, ScrollView, Modal
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc, deleteDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { db, auth, storage } from '../../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import SummaryScreen from './SummaryScreen';
import DoctorsScreen from './DoctorsScreen';
import Markdown from 'react-native-markdown-display';
import cachedSummaryBenignKeratosis from '../../../assets/summary_cache_benign_keratosis.json';
const logo = require('../../../assets/images/transparent-logo-v.png');
const headerLogo = require('../../../assets/images/transparent-logo.png');
const doctorIcon = require('../../../assets/images/doctor.png');

// Enable fast loading for demo (uses cached summary for Benign Keratosis)
const ENABLE_FAST_SUMMARY_LOADING = false;

const { height: screenHeight } = Dimensions.get('window');

type Message = {
  id: string;
  text: string;
  user: string;
  userId: string;
  createdAt?: Timestamp;
  sender: 'user' | 'bot';
  image?: string;
};

type Summary = {
  diagnosis: string;
  symptoms: string[];
  causes: string[];
  treatments: string[];
  specialty: string;
  severity?: string;
};

export default function ChatScreen({ chatId }: { chatId: string }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [expandedCard, setExpandedCard] = useState<'summary' | 'doctors' | null>(null);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const scrollOffset = useRef(0);
  const contentHeight = useRef(0);
  const listHeight = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const settingsSlideAnim = useRef(new Animated.Value(300)).current;
  const [chatTitle, setChatTitle] = useState('Chat');
  const [chatCategory, setChatCategory] = useState<'skin' | 'oral' | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [summary, setSummary] = useState<Summary>({
    diagnosis: "Not enough information",
    symptoms: [],
    causes: [],
    treatments: [],
    specialty: "",
    severity: undefined
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isTitleManuallyChanged, setIsTitleManuallyChanged] = useState(false);
  const [revealedImages, setRevealedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      console.log("keyboard showing")
      flatListRef.current?.scrollToEnd({ animated: false });
    });
  
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);
  
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, `chats/${chatId}/messages`), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Map backend role to frontend sender
        const sender = data.role === 'patient' ? 'user' : (data.role === 'assistant' ? 'bot' : data.sender || 'user');
        // Map backend content to frontend text
        const text = data.content || data.text || '';
        // Get image from metadata if available
        const image = data.metadata?.image_url || data.image || undefined;
        // Filter out "[Image Sent]" placeholder text - replace with empty string
        let messageText = text;
        if (messageText && (messageText.includes('[Image Sent]') || messageText.includes('[Image sent]') || messageText.includes('Image Sent'))) {
          messageText = '';
        }
        
        return {
          id: doc.id,
          text: messageText,
          user: data.user || auth.currentUser?.displayName || 'You',
          userId: data.userId || auth.currentUser?.uid || '',
          createdAt: data.timestamp || data.createdAt,
          sender,
          image,
        } as Message;
      });
      // Remove any temporary optimistic messages when real messages arrive from Firestore
      setMessages(prev => {
        // Keep optimistic messages that don't have a real counterpart yet
        const realMessageKeys = new Set(
          msgs.map(m => {
            // For image messages, match by image URL; for text messages, match by text
            if (m.image) return `image:${m.image}`;
            return `text:${m.text}`;
          })
        );
        const filteredPrev = prev.filter(msg => {
          // Keep real messages or optimistic messages that haven't been saved yet
          if (!msg.id.startsWith('temp-')) return true;
          // Remove optimistic message if a real one with same key exists
          const msgKey = msg.image ? `image:${msg.image}` : `text:${msg.text}`;
          return !realMessageKeys.has(msgKey);
        });
        // Merge: combine filtered optimistic messages with real messages
        const combined = [...filteredPrev.filter(m => m.id.startsWith('temp-')), ...msgs];
        // Sort by createdAt if available, otherwise keep order
        return combined.sort((a, b) => {
          const aTime = a.createdAt?.toMillis() || 0;
          const bTime = b.createdAt?.toMillis() || 0;
          return aTime - bTime;
        });
      });
      console.log("setting messages", msgs)
      
      // Scroll to bottom when messages are first loaded or updated
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    });
    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom when component mounts or messages change
  // But skip if we just uploaded an image (handled separately)
  useEffect(() => {
    if (messages.length > 0) {
      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Small delay to ensure FlatList is rendered
      scrollTimeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
    
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [messages.length]);

  useEffect(() => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
  
    const unsubscribe = onSnapshot(chatRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setChatTitle(data.title || 'Chat');
        setChatCategory(data.category || null);
        setIsTitleManuallyChanged(data.isTitleManuallyChanged || false);
        
        // Load summary from Firestore if it exists
        if (data.summary && 
            data.summary.diagnosis && 
            data.summary.diagnosis !== "Not enough information" &&
            data.summary.diagnosis.trim() !== "") {
          console.log('📥 Loading summary from Firestore:', data.summary);
          
          const loadedSummary: Summary = {
            diagnosis: data.summary.diagnosis || "Not enough information",
            symptoms: data.summary.symptoms || [],
            causes: data.summary.causes || [],
            treatments: data.summary.treatments || [],
            specialty: data.summary.specialty || "",
            severity: data.summary.severity || data.metadata?.report?.severity_level || undefined,
          };
          
          // Only set summary if we don't already have a valid one (avoid overwriting newly generated summaries)
          setSummary(prev => {
            // If current summary is empty/invalid, use the loaded one
            if (!prev.diagnosis || 
                prev.diagnosis === "Not enough information" || 
                prev.diagnosis.trim() === "") {
              return loadedSummary;
            }
            // Otherwise keep the current summary
            return prev;
          });
          
          // Auto-update chat title to diagnosis if title wasn't manually changed
          const titleManuallyChanged = data.isTitleManuallyChanged || false;
          if (!titleManuallyChanged && loadedSummary.diagnosis) {
            console.log('📝 Auto-updating chat title to diagnosis from loaded summary:', loadedSummary.diagnosis);
            const chatRef = doc(db, 'chats', chatId);
            updateDoc(chatRef, {
              title: loadedSummary.diagnosis,
            }).catch(err => {
              console.error('Error updating chat title:', err);
            });
            setChatTitle(loadedSummary.diagnosis);
          }
        }
      }
    });
  
    return () => unsubscribe();
  }, [chatId]);

  // Removed duplicate scroll handler - handled by messages.length effect above

  // Debounce summary generation to prevent infinite loops
  const summaryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(0);
  const isGeneratingSummaryRef = useRef(false);

  useEffect(() => {
    // Only generate summary if message count actually increased (new messages added)
    // and we're not already generating a summary
    if (messages.length <= lastMessageCountRef.current || isGeneratingSummaryRef.current) {
      lastMessageCountRef.current = messages.length;
      return;
    }
    
    // Clear existing timeout
    if (summaryTimeoutRef.current) {
      clearTimeout(summaryTimeoutRef.current);
    }
    
    // Only generate summary if there are bot messages and enough messages to summarize
    const hasBotMessages = messages.some(m => m.sender === 'bot' && m.text);
    if (!hasBotMessages || messages.length < 2) {
      lastMessageCountRef.current = messages.length;
      return;
    }
    
    // Debounce: wait 5 seconds after last message before generating summary
    // This prevents rapid-fire API calls
    summaryTimeoutRef.current = setTimeout(async () => {
      if (isGeneratingSummaryRef.current) return; // Prevent concurrent calls
      isGeneratingSummaryRef.current = true;
      try {
        await generateSummary(messages);
      } finally {
        isGeneratingSummaryRef.current = false;
        lastMessageCountRef.current = messages.length;
      }
    }, 5000); // Increased to 5 seconds to reduce API calls
    
    return () => {
      if (summaryTimeoutRef.current) {
        clearTimeout(summaryTimeoutRef.current);
      }
    };
  }, [messages])

  // Check if summary has valid data
  const hasValidSummary = () => {
    return summary.diagnosis && 
           summary.diagnosis !== "Not enough information" && 
           summary.diagnosis.trim() !== "";
  };

  // Save summary to Firestore
  const saveSummaryToFirestore = async (summaryToSave: Summary) => {
    console.log('💾 saveSummaryToFirestore called');
    console.log('💾 chatId:', chatId);
    console.log('💾 summaryToSave:', JSON.stringify(summaryToSave, null, 2));
    
    try {
      if (!chatId) {
        console.warn('⚠️ Cannot save summary: chatId is missing');
        return;
      }

      // Only save if summary is valid
      if (!summaryToSave.diagnosis || 
          summaryToSave.diagnosis === "Not enough information" || 
          summaryToSave.diagnosis.trim() === "") {
        console.log('⏭️ Skipping summary save - not enough information');
        console.log('   diagnosis value:', summaryToSave.diagnosis);
        return;
      }

      console.log('💾 Summary is valid, proceeding to save...');
      const chatRef = doc(db, 'chats', chatId);
      
      const summaryData: any = {
        summary: {
          diagnosis: summaryToSave.diagnosis,
          symptoms: summaryToSave.symptoms,
          causes: summaryToSave.causes,
          treatments: summaryToSave.treatments,
          specialty: summaryToSave.specialty,
          severity: summaryToSave.severity,
        },
        summaryUpdatedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Auto-update chat title to diagnosis if title wasn't manually changed
      if (!isTitleManuallyChanged && summaryToSave.diagnosis) {
        console.log('📝 Auto-updating chat title to diagnosis:', summaryToSave.diagnosis);
        summaryData.title = summaryToSave.diagnosis;
        setChatTitle(summaryToSave.diagnosis);
      }
      
      console.log('💾 Summary data to save:', JSON.stringify(summaryData, null, 2));
      console.log('💾 Calling updateDoc...');
      
      await updateDoc(chatRef, summaryData);

      console.log('✅ Summary saved to Firestore successfully');
    } catch (error) {
      console.error('❌ Error saving summary to Firestore:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      // Don't show alert to user - this is a background operation
    }
  };

  // Fast loading: Set cached summary immediately if enabled (for demo)
  useEffect(() => {
    if (ENABLE_FAST_SUMMARY_LOADING) {
      // Check if summary is already set (avoid unnecessary updates)
      if (hasValidSummary()) {
        return;
      }

      // Check if we should use cached summary (for demo purposes)
      const hasBotMessages = messages.some(m => m.sender === 'bot' && m.text);
      const shouldUseCached = hasBotMessages && messages.some(m => {
        const text = (m.text || '').toLowerCase();
        return text.includes('benign keratosis') || 
               text.includes('seborrheic keratosis') || 
               text.includes('keratosis') ||
               text.includes('skin lesion') ||
               text.includes('diagnosis');
      });

      // For demo: if there are bot messages mentioning diagnosis/keratosis, use cached summary
      if (shouldUseCached) {
        console.log('🚀 Setting cached summary for Benign Keratosis (fast loading)');
        const cachedSummary = cachedSummaryBenignKeratosis as Summary;
        setSummary(cachedSummary);
        
        // Save cached summary to Firestore
        saveSummaryToFirestore(cachedSummary);
      }
    }
  }, [messages.length]); // Re-check when message count changes

  const openDrawer = () => {
    Keyboard.dismiss();
    setDrawerVisible(true);
    // Set doctors to be expanded when drawer opens
    setExpandedCard('doctors');
    Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
  };

  const closeDrawer = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: true }).start(() => {
      setDrawerVisible(false);
      setExpandedCard(null); // Reset expanded card when closing
    });
  };

  const BACKEND_URL = 'https://supervisor-agent-139431081773.us-central1.run.app/api/v1/main';

  async function getGeminiResponse(msg: string, imageUrl?: string) {
    try {
      if (!auth.currentUser) {
        return "Please sign in to continue.";
      }

      // Get Firebase auth token
      const token = await auth.currentUser.getIdToken();
      
      // Determine speciality from chatCategory
      const speciality = chatCategory || 'skin'; // Default to 'skin' if not set
      
      const requestBody = {
        message: msg || '',
        image_url: imageUrl || '',
        user_id: auth.currentUser.uid,
        chat_id: chatId,
        type: imageUrl ? 'image' : 'text',
        speciality: speciality
      };

      console.log('🔵 Backend API Request:', {
        url: BACKEND_URL,
        method: 'POST',
        body: requestBody
      });
      
      // Debug: Log what message value is being sent for image uploads
      if (imageUrl) {
        console.log('📸 Image upload - message value being sent:', `'${requestBody.message}' (length: ${requestBody.message.length})`);
        if (requestBody.message && requestBody.message.trim()) {
          console.warn('⚠️ Image upload has non-empty message:', requestBody.message);
        } else {
          console.log('✅ Image upload has empty message as expected');
        }
      }

      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('🟢 Backend API Response Status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔴 Backend API Error Response:', errorText);
        throw new Error(`Backend API error: ${response.status} - ${errorText}`);
      }

      const responseText = await response.text();
      console.log('🟡 Backend API Raw Response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('🟢 Backend API Parsed JSON:', JSON.stringify(data, null, 2));
      } catch (parseError) {
        console.error('🔴 Backend API Response is not valid JSON:', parseError);
        console.log('🟡 Returning raw response text');
        return responseText || "Sorry, something went wrong.";
      }

      // If this is a report response, extract and save summary
      console.log('🔍 Checking response type:', data.response_type);
      console.log('🔍 Has report data at top level?', !!data.report);
      console.log('🔍 Has report data in metadata?', !!data.metadata?.report);
      console.log('🔍 Full response data keys:', Object.keys(data));
      
      // Report is nested inside metadata.report, not at top level
      if (data.response_type === 'report' && data.metadata?.report) {
        console.log('📊 Report response detected, extracting summary...');
        console.log('📊 Report data:', JSON.stringify(data.metadata.report, null, 2));
        console.log('📊 Metadata data:', JSON.stringify(data.metadata, null, 2));
        // Don't await - let it run in background
        extractSummaryFromReport(data).catch(err => {
          console.error('❌ Error extracting summary from report:', err);
        });
      } else {
        console.log('⚠️ Not a report response or missing report data');
        console.log('   response_type:', data.response_type);
        console.log('   has report (top level):', !!data.report);
        console.log('   has report (in metadata):', !!data.metadata?.report);
      }

      // Check various possible response formats
      if (data.response) {
        console.log('✅ Using data.response');
        return data.response;
      } else if (data.message) {
        console.log('✅ Using data.message');
        return data.message;
      } else if (data.text) {
        console.log('✅ Using data.text');
        return data.text;
      } else if (typeof data === 'string') {
        console.log('✅ Response is a string');
        return data;
      } else {
        console.warn('⚠️ Unknown response format, returning full data:', data);
        return JSON.stringify(data) || "Sorry, something went wrong.";
      }
    } catch (error) {
      console.error("API error:", error);
      return "Sorry, something went wrong.";
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Save user input locally for optimistic UI update
    const userMessageText = input;
    setInput(''); // Clear input immediately for better UX
    
    // Optimistic UI update: Add user message immediately to local state
    const tempId = `temp-${Date.now()}`;
    const optimisticUserMessage: Message = {
      id: tempId,
      text: userMessageText,
      user: auth.currentUser?.displayName || 'You',
      userId: auth.currentUser?.uid || '',
      sender: 'user',
      createdAt: Timestamp.now(),
    };
    
    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticUserMessage]);
    
    // Scroll to bottom to show the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    // Send to backend - backend will handle saving to Firestore
    // The Firestore listener will pick up the messages when backend saves them
    // The real message from Firestore will replace the optimistic one
    try {
      await getGeminiResponse(userMessageText);
      // Backend handles saving both user and bot messages to Firestore
      // Frontend just listens via onSnapshot to update UI
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // Restore input
      setInput(userMessageText);
      // Optionally show error to user
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const uploadImageAsync = async (uri: string, chatId: string) => {
    try {
      // Fetch the image as a blob for React Native
    const response = await fetch(uri);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      // Convert to blob
    const blob = await response.blob();
      
    const filename = `chats/${chatId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSendImage = () => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel'];
    const cancelButtonIndex = 2;
  
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await launchCamera();
          } else if (buttonIndex === 1) {
            await launchImageLibrary();
          }
        }
      );
    } else {
      Alert.alert(
        'Send Image',
        'Choose an option',
        [
          { text: 'Take Photo', onPress: launchCamera },
          { text: 'Choose from Library', onPress: launchImageLibrary },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  };

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.length > 0) {
      await handleImageUpload(result.assets[0].uri);
    }
  };
  
  const launchImageLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.6,
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      await handleImageUpload(result.assets[0].uri);
    }
  };

  const handleImageUpload = async (localUri: string) => {
    try {
      // Upload to Firebase Storage to get a publicly accessible URL
      // Backend requires image_url to be http, https, or gs:// (not base64 due to validation)
      const imageUrl = await uploadImageAsync(localUri, chatId);
      setImages(prev => [...prev, imageUrl]);
  
      // Optimistic UI update: Add user message with image immediately to local state
      const tempId = `temp-image-${Date.now()}`;
      const optimisticUserMessage: Message = {
        id: tempId,
        text: '', // Empty text as requested
        user: auth.currentUser?.displayName || 'You',
        userId: auth.currentUser?.uid || '',
        sender: 'user',
        image: imageUrl,
        createdAt: Timestamp.now(),
      };
      
      // Add optimistic message immediately
      setMessages(prev => [...prev, optimisticUserMessage]);
      
      // Scroll to bottom after image has time to load and render
      // Clear any existing scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Use multiple timeouts to ensure we scroll after image loads
      scrollTimeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
        // Second scroll after a bit more time to account for image rendering
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }, 100);
  
      // Update chat timestamp
      await updateDoc(doc(db, `chats/${chatId}`), {
        last_message_at: serverTimestamp()
      });
  
      // Send Firebase Storage URL to backend API
      // Backend will download from this URL and process the image
      // Backend will handle saving both user message (with image) and bot response to Firestore
      // Pass empty string for message to ensure no placeholder text
      try {
        await getGeminiResponse('', imageUrl);
      } catch (error) {
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        throw error;
      }
  
    } catch (error) {
      console.error("Image upload or analysis failed:", error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    }
  };

  const renderExpandableCard = (title: string, key: 'summary' | 'doctors', Component: React.ComponentType<any>) => {
    const isSummary = key === 'summary';
    const canExpand = isSummary ? hasValidSummary() : true;
    const isNoSummary = isSummary && !canExpand;
    
    return (
      <View style={[
        styles.card, 
        expandedCard === key && { height: screenHeight * 0.65 },
        isNoSummary && styles.cardNoSummary
      ]}> 
        <TouchableOpacity 
          onPress={() => {
            if (canExpand) {
              setExpandedCard(prev => prev === key ? null : key);
            } else {
              Alert.alert(
                "No Summary Available",
                "There's no summary yet. Please continue your conversation to generate a summary."
              );
            }
          }}
          disabled={!canExpand && expandedCard !== key}
          style={isNoSummary ? styles.cardHeaderNoSummary : undefined}
        >
          <View style={isNoSummary ? styles.cardTitleRow : undefined}>
            <Text style={[styles.cardTitle, isNoSummary && styles.cardTitleNoSummary]}>{title}</Text>
            {isNoSummary && (
              <Text style={styles.noSummaryText}>No summary available yet.</Text>
            )}
          </View>
          {
            expandedCard === key ? null : (
              !isNoSummary && (
                <Text style={styles.cardText}>
                  {isSummary 
                    ? 'Summary of your recent chat.'
                    : 'Find nearby providers for follow-up care.'}
                </Text>
              )
            )
        }
      </TouchableOpacity>
        {expandedCard === key && canExpand ? (
        <View style={styles.expandedCardContent}>
          <Component chatId={chatId} />
        </View>
      ) : (
        null
      )}
    </View>
  );
  };

  const markdownStyles = {
    body: {
      fontSize: 15,
      color: '#2c3e50',
    },
    link: {
      color: '#1e90ff',
    },
    code_inline: {
      backgroundColor: '#eee',
      padding: 4,
      borderRadius: 4,
      fontFamily: 'Courier',
    },
    code_block: {
      backgroundColor: '#eee',
      padding: 10,
      borderRadius: 8,
      fontFamily: 'Courier',
    },
    heading1: {
      fontSize: 22,
      fontWeight: 'bold' as 'bold',
    },
    // add more if needed
  } as any;

  const openSettingsDrawer = () => {
    setSettingsVisible(true);
    Animated.timing(settingsSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const closeSettingsDrawer = () => {
    Animated.timing(settingsSlideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setSettingsVisible(false));
  };

  const renameChatTitle = async () => {
    if (!newTitle.trim()) return;
  
    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        title: newTitle.trim(),
        isTitleManuallyChanged: true, // Mark that user manually changed the title
        updatedAt: serverTimestamp(),
      });
  
      // Update local state
      setIsTitleManuallyChanged(true);
      setChatTitle(newTitle.trim());
  
      // Optional: Close settings drawer or show confirmation
      // setSettingsVisible(false);
      setNewTitle('');
      Alert.alert("Success", "Chat title has been updated.");
    } catch (error) {
      console.error("Failed to rename chat:", error);
    }
  };

  // Extract summary from agent report response
  const extractSummaryFromReport = async (responseData: any) => {
    console.log('🔧 extractSummaryFromReport called');
    console.log('🔧 responseData keys:', Object.keys(responseData));
    try {
      const report = responseData.report || responseData.metadata?.report || {};
      const metadata = responseData.metadata || {};
      
      console.log('🔧 Report object keys:', Object.keys(report));
      console.log('🔧 Metadata object keys:', Object.keys(metadata));
      console.log('🔧 Report data:', JSON.stringify(report, null, 2));
      console.log('🔧 Metadata data:', JSON.stringify(metadata, null, 2));
      
      // Extract diagnosis
      const diagnosis = report.disease_type || 
                       metadata.diagnosis?.diagnosis_name || 
                       "Not enough information";
      
      console.log('🔧 Extracted diagnosis:', diagnosis);
      
      // Extract symptoms
      let symptoms: string[] = [];
      if (report.symptoms && report.symptoms !== "None mentioned") {
        if (Array.isArray(report.symptoms)) {
          symptoms = report.symptoms;
        } else if (typeof report.symptoms === 'string') {
          // Try to parse if it's a comma-separated string
          symptoms = report.symptoms.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          if (symptoms.length === 0) {
            symptoms = ["Not enough information"];
          }
        }
      } else {
        symptoms = ["Not enough information"];
      }
      
      // Extract causes (from report output or other_information)
      let causes: string[] = [];
      const causeText = report.other_information || report.output || '';
      if (causeText && causeText !== "Not enough information") {
        // Try to extract causes from the text
        // For now, we'll use a simple approach - split by sentences or use the whole text
        const sentences = causeText.split(/[.!?]\s+/).filter((s: string) => s.trim().length > 0);
        causes = sentences.slice(0, 5); // Limit to 5 causes
        if (causes.length === 0) {
          causes = ["Not enough information"];
        }
      } else {
        causes = ["Not enough information"];
      }
      
      // Extract treatments (from report output, home_remedy_details, or recommendations)
      let treatments: string[] = [];
      const treatmentSources = [
        report.home_remedy_details,
        report.output,
        ...(Array.isArray(report.recommendations) ? report.recommendations : [])
      ].filter(Boolean);
      
      if (treatmentSources.length > 0) {
        // Combine all treatment sources and extract key points
        const treatmentText = treatmentSources.join(' ');
        const sentences = treatmentText.split(/[.!?]\s+/).filter((s: string) => s.trim().length > 0);
        treatments = sentences.slice(0, 6); // Limit to 6 treatments
        if (treatments.length === 0) {
          treatments = ["Not enough information"];
        }
      } else {
        treatments = ["Not enough information"];
      }
      
      // Extract specialty from recommended_specialist
      let specialty = '';
      if (report.recommended_specialist) {
        const specialist = report.recommended_specialist.toLowerCase();
        if (specialist.includes('dermatologist') || specialist.includes('dermatology')) {
          specialty = 'Dermatology';
        } else if (specialist.includes('dentist') || specialist.includes('dental')) {
          specialty = 'Dental';
        } else {
          specialty = report.recommended_specialist;
        }
      } else if (report.speciality) {
        // Fallback to speciality field
        specialty = report.speciality === 'skin' ? 'Dermatology' : 
                   report.speciality === 'oral' ? 'Dental' : 
                   report.speciality;
      }
      
      // Extract severity from metadata.report.severity_level
      const severity = metadata.report?.severity_level || report.severity_level || undefined;
      
      const extractedSummary: Summary = {
        diagnosis,
        symptoms,
        causes,
        treatments,
        specialty,
        severity
      };
      
      console.log('✅ Summary extracted from report:', JSON.stringify(extractedSummary, null, 2));
      console.log('✅ Setting summary to state...');
      setSummary(extractedSummary);
      
      // Save summary to Firestore
      console.log('💾 Calling saveSummaryToFirestore...');
      await saveSummaryToFirestore(extractedSummary);
      console.log('💾 saveSummaryToFirestore completed');
      
      return extractedSummary;
    } catch (error) {
      console.error('❌ Error extracting summary from report:', error);
      return null;
    }
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "chats", chatId));
              // Navigate back to dashboard with the chat's category
              // Map 'oral' back to 'dental' for dashboard route
              let category = chatCategory || 'skin'; // Default to skin if category not set
              if (category === 'oral') {
                category = 'dental';
              }
              router.replace(`/dashboard?category=${category}`);
            } catch (error) {
              Alert.alert("Error", "Could not delete chat.");
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const generateSummary = async (msgs: Message[]) => {
    // Fast loading: Use cached summary for Benign Keratosis demo
    if (ENABLE_FAST_SUMMARY_LOADING) {
    const relevantTexts = msgs
        .filter(m => m.sender === 'bot' && m.text && !m.text.includes("[Image]") && !m.text.includes("Rate limit"))
      .map(m => m.text)
      .join('\n');
  
      // Check if conversation mentions Benign Keratosis
      const textLower = relevantTexts.toLowerCase();
      if (textLower.includes('benign keratosis') || textLower.includes('seborrheic keratosis') || textLower.includes('keratosis')) {
        console.log('🚀 Using cached summary for Benign Keratosis (fast loading)');
        const cachedSummary = cachedSummaryBenignKeratosis as Summary;
        setSummary(cachedSummary);
        
        // Save cached summary to Firestore
        await saveSummaryToFirestore(cachedSummary);
        
        return cachedSummary;
      }
    }

    // Prevent summary generation if we're in the middle of a chat
    // Only generate summary for completed conversations
    const recentMessages = msgs.slice(-5); // Check last 5 messages
    const hasRecentBotMessage = recentMessages.some(m => m.sender === 'bot');
    const hasRecentUserMessage = recentMessages.some(m => m.sender === 'user');
    
    // If there's a recent user message, the conversation is still active - skip summary
    if (hasRecentUserMessage) {
      console.log('⏭️ Skipping summary - conversation still active');
      return;
    }
    
    const relevantTexts = msgs
      .filter(m => m.sender === 'bot' && m.text && !m.text.includes("[Image]") && !m.text.includes("Rate limit"))
      .map(m => m.text)
      .join('\n');
    
    // Don't generate summary if there's not enough content
    if (relevantTexts.length < 50) {
      console.log('⏭️ Skipping summary - not enough content');
      return;
    }
  
    console.log('🔄 Generating summary...');
    const geminiPrompt = `
      You're an assistant that summarizes skin lesion diagnosis conversations.
      
      Analyze the following conversation between a user and an AI model that classifies images of skin lesions. Based on the bot messages below, extract and organize the information into the following JSON format:
      
      {
        "diagnosis": "string",
        "symptoms": "list of string",
        "causes": "list of string",
        "treatments": "list of string",
        "specialty" : "string"
      }
      
      Here is the json of all the specialties taxonomy; Please use this information to select a specialty from this list; If there isn't enough information, leave specialty as blank.
      If any of the fields lack sufficient information, respond with "Not enough information" for that field (but symptoms, causes, and treatments are still going to be in a list).

      Give response just as a pure json.
      
      Conversation:
      ${relevantTexts}
      `;
  
    try {
    const responseText = await getGeminiResponse(geminiPrompt);

      console.log("📋 Summary responseText", responseText);

      if (
        !responseText.includes('{') ||
        !responseText.includes('}')
      ) {
        console.warn("⚠️ Summary response not JSON. Skipping.");
        return {
          diagnosis: "Not enough information",
          symptoms: [],
          causes: [],
          treatments: [],
          specialty: ""
        };
      }
      
      const cleanJson = responseText
      .replace(/```json|```/g, '') // Remove Markdown blocks
      .trim();

      const parsed: Summary = JSON.parse(cleanJson);
      setSummary(parsed);
      console.log('✅ Summary generated successfully');
      
      // Save summary to Firestore
      await saveSummaryToFirestore(parsed);
      
      return parsed;
    } catch (err) {
      console.error("❌ Summary generation error:", err);
      return {
        diagnosis: "Not enough information",
        symptoms: ["Not enough information"],
        causes: ["Not enough information"],
        treatments: ["Not enough information"],
        specialty: ""
      };
    }
  };

  return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={50}>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>
              {/* Header section */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                  // Navigate back to dashboard with the chat's category
                  // Map 'oral' back to 'dental' for dashboard route
                  let category = chatCategory || 'skin'; // Default to skin if category not set
                  if (category === 'oral') {
                    category = 'dental';
                  }
                  router.replace(`/dashboard?category=${category}`);
                }}>
                  <Ionicons name="chevron-back" size={28} color="#000" />
                </TouchableOpacity>
                <View style={styles.headerLogoContainer}>
                  <Image source={headerLogo} style={styles.headerLogo} resizeMode="contain" />
                      </View>
                <View style={styles.headerIcons}>
                  <TouchableOpacity onPress={openDrawer} style={styles.doctorIconButton}>
                    <Image source={doctorIcon} style={styles.doctorIcon} resizeMode="contain" />
                  </TouchableOpacity>
                </View>
              </View>
              </TouchableWithoutFeedback>

              {/* Message list */}
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messages}
                keyboardShouldPersistTaps="handled"
                onScroll={(event) => {
                  // Scroll tracking logic
                  const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

                  scrollOffset.current = contentOffset.y;
                  contentHeight.current = contentSize.height;
                  listHeight.current = layoutMeasurement.height;

                  const paddingToBottom = 30;
                  const isNearBottom = layoutMeasurement.height + contentOffset.y +300 >= contentSize.height - paddingToBottom;

                  setShowScrollToBottom(!isNearBottom);
                }}
                scrollEventThrottle={100}
                renderItem={({ item }) => (
                  <View style={{ width: '100%', flexDirection: item.sender === 'bot' ? 'row' : 'row-reverse', alignItems: 'flex-start', marginBottom: 10 }}>
                    {item.sender === 'bot' && (
                      <Image source={logo} style={styles.botAvatar} />
                    )}
                
                    <View style={[styles.messageBubble, item.sender === 'bot' ? styles.botBubble : styles.userBubble]}>
                      {item.sender === 'bot' && (
                        <Text style={styles.sender}>Viscura</Text>
                      )}
                      {item.image && (
                        <View style={styles.imageContainer}>
                          <Image 
                            source={{ uri: item.image }} 
                            style={styles.imagePreview}
                            onLoad={() => {
                              // Scroll to bottom after image loads
                              setTimeout(() => {
                                flatListRef.current?.scrollToEnd({ animated: true });
                              }, 100);
                            }}
                          />
                          {!revealedImages.has(item.id) && (
                            <BlurView intensity={15} tint="light" style={styles.imageBlurOverlay}>
                              <TouchableOpacity 
                                style={styles.showImageButton}
                                onPress={() => {
                                  setRevealedImages(prev => new Set(prev).add(item.id));
                                }}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="eye" size={20} color="#000" />
                                <Text style={styles.showImageButtonText}>Show Image</Text>
                              </TouchableOpacity>
                            </BlurView>
                          )}
                        </View>
                      )}
                      {item.text && item.text.trim() && (
                      <Markdown style={markdownStyles}>{item.text}</Markdown>
                      )}
                    </View>
                  </View>
                )}
                onContentSizeChange={() => {
                  // Debounce scroll to prevent multiple rapid scrolls
                  // This is especially important when images are loading
                  if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                  }
                  scrollTimeoutRef.current = setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: false });
                  }, 50);
                }}
                onLayout={(event) => {
                  listHeight.current = event.nativeEvent.layout.height;
                }}
              />
              </TouchableWithoutFeedback>

              {/* Scroll to bottom button */}
              {showScrollToBottom && (
                <TouchableOpacity
                onPress={() => {
                  if (flatListRef.current && contentHeight.current && listHeight.current) {
                    flatListRef.current.scrollToOffset({
                      offset: Math.max(contentHeight.current - listHeight.current, 0),
                      animated: true,
                    });
                  }
                }}
                  style={styles.scrollToBottomButton}
                >
                  <Ionicons name="chevron-down" size={28} color="#fff" />
                </TouchableOpacity>
              )}

              {/* Input field section */}
              <View style={styles.inputContainer}>
                <TouchableOpacity onPress={handleSendImage} style={styles.iconButton}>
                  <Feather name="camera" size={22} color="#333" />
                </TouchableOpacity>
                <TextInput style={styles.input} placeholder="Type a message..." value={input} onChangeText={setInput} />
                <TouchableOpacity onPress={handleSend} style={styles.sendButton}>
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Drawer panel */}
            {drawerVisible && (
              <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
                <View style={styles.drawerHeader}>
                  <TouchableOpacity onPress={closeDrawer} style={{ marginRight: 12 }}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.drawerTitle}>Back to Chat</Text>
                  <TouchableOpacity onPress={openSettingsDrawer} style={{ marginLeft: 'auto' }}>
                    <Ionicons name="settings-outline" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1 }}>
                  {renderExpandableCard('Summary', 'summary', () => <SummaryScreen summary={summary} />)}
                  {renderExpandableCard('Doctors Near Me', 'doctors', () => <DoctorsScreen summary={summary} chatCategory={chatCategory === 'oral' ? 'dental' : (chatCategory === 'skin' ? 'skin' : null)} />)}
                  {/* <TouchableOpacity style={styles.leaveButton} onPress={() => {}}>
                    <Text style={styles.leaveButtonText}>Leave Chat</Text>
                  </TouchableOpacity> */}
                </View>
              </Animated.View>
            )}

            {settingsVisible && (
              <Animated.View style={[styles.settingsDrawer, { transform: [{ translateX: settingsSlideAnim }] }]}>
                <View style={styles.drawerHeader}>
                  <TouchableOpacity onPress={closeSettingsDrawer}>
                    <Ionicons name="chevron-back" size={28} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.drawerTitle}>Settings</Text>
                </View>

                <View style={{ paddingHorizontal: 8 }}>
                  <Text style={{ marginBottom: 4, fontWeight: '600' }}>Rename Chat</Text>
                  <TextInput
                    placeholder={chatTitle}
                    value={newTitle}
                    onChangeText={setNewTitle}
                    style={styles.renameInput}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity style={styles.renameButton} onPress={renameChatTitle}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Rename</Text>
                  </TouchableOpacity>

                  <View style={{ marginVertical: 20 }} />

                  <TouchableOpacity style={styles.leaveButton} onPress={() => handleDeleteChat(chatId)}>
                    <Text style={styles.leaveButtonText}>Leave Chat Room</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
                      </View>
      </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafe',
  },
  headerLogoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    width: 140,
    height: 60,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  doctorIconButton: {
    padding: 4,
  },
  doctorIcon: {
    width: 28,
    height: 28,
  },
  container: { flex: 1, backgroundColor: '#f9fafe' },
  messages: { padding: 12, paddingBottom: 40 },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 6,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 1 },
  },
  userBubble: {
    backgroundColor: '#d2ecf9',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#f2f2f2',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  sender: {
    fontWeight: '600',
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#2c3e50'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 40,
    marginHorizontal: 10,
    backgroundColor: '#fff',
    color: '#000'
  },
  imageContainer: {
    position: 'relative',
    marginTop: 6,
    marginBottom: 4,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  imageBlurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  showImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  showImageButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#2c3e50',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#f9fafe',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    padding: 16,
    zIndex: 10,
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    fontSize: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  card: {
    backgroundColor: '#DBEDEC',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#A5CCC9',
  },
  cardNoSummary: {
    minHeight: 50,
    paddingVertical: 12,
  },
  cardHeaderNoSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  cardTitleNoSummary: {
    marginBottom: 0,
  },
  noSummaryText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 0,
  },
  cardText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  disabledText: {
    color: '#999',
    fontStyle: 'italic',
  },
  leaveButton: {
    backgroundColor: '#ef5350',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expandedCardContent: {
    flex: 1,
    marginTop: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#2c3e50',
    borderRadius: 30,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  settingsDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '100%',
    backgroundColor: '#f9fafe',
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    padding: 16,
    zIndex: 15,
    elevation: 6,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  renameButton: {
    backgroundColor: '#2c3e50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  
  modalLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#f1f1f1',
  },
  
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    backgroundColor: '#2c3e50',
  },
  titleInput: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    textAlign: 'center',
    fontSize: 16,
    paddingVertical: 8,
    marginBottom: 24,
    color: '#ccc',
  },
});