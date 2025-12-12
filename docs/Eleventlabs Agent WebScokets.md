\# Agent WebSockets

GET /v1/convai/conversation

Establish a WebSocket connection for real-time conversations with an AI agent.

Reference: https://elevenlabs.io/docs/agents-platform/api-reference/agents-platform/websocket

\#\# AsyncAPI Specification

\`\`\`yaml  
asyncapi: 2.6.0  
info:  
  title: V 1 Convai Conversation  
  version: subpackage\_v1ConvaiConversation.v1ConvaiConversation  
  description: \>-  
    Establish a WebSocket connection for real-time conversations with an AI  
    agent.  
channels:  
  /v1/convai/conversation:  
    description: \>-  
      Establish a WebSocket connection for real-time conversations with an AI  
      agent.  
    bindings:  
      ws:  
        query:  
          type: object  
          properties:  
            agent\_id:  
              description: Any type  
    publish:  
      operationId: v-1-convai-conversation-publish  
      summary: subscribe  
      description: \>-  
        Defines the message types that can be received by the client from the  
        server  
      message:  
        name: subscribe  
        title: subscribe  
        description: \>-  
          Defines the message types that can be received by the client from the  
          server  
        payload:  
          $ref: '\#/components/schemas/V1ConvaiConversationSubscribe'  
    subscribe:  
      operationId: v-1-convai-conversation-subscribe  
      summary: publish  
      description: Defines the message types that can be sent from client to server  
      message:  
        name: publish  
        title: publish  
        description: Defines the message types that can be sent from client to server  
        payload:  
          $ref: '\#/components/schemas/V1ConvaiConversationPublish'  
servers:  
  Production:  
    url: wss://api.elevenlabs.io/  
    protocol: wss  
    x-default: true  
  Production-US:  
    url: wss://api.us.elevenlabs.io/  
    protocol: wss  
  Production-EU:  
    url: wss://api.eu.residency.elevenlabs.io/  
    protocol: wss  
  Production-India:  
    url: wss://api.in.residency.elevenlabs.io/  
    protocol: wss  
components:  
  schemas:  
    ConversationInitiationMetadataConversationInitiationMetadataEvent:  
      type: object  
      properties:  
        conversation\_id:  
          type: string  
        agent\_output\_audio\_format:  
          type: string  
        user\_input\_audio\_format:  
          type: string  
    ConversationInitiationMetadata:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: conversation\_initiation\_metadata  
        conversation\_initiation\_metadata\_event:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationMetadataConversationInitiationMetadataEvent  
    UserTranscriptUserTranscriptionEvent:  
      type: object  
      properties:  
        user\_transcript:  
          type: string  
    UserTranscript:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: user\_transcript  
        user\_transcription\_event:  
          $ref: '\#/components/schemas/UserTranscriptUserTranscriptionEvent'  
    AgentResponseAgentResponseEvent:  
      type: object  
      properties:  
        agent\_response:  
          type: string  
      required:  
        \- agent\_response  
    AgentResponse:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: agent\_response  
        agent\_response\_event:  
          $ref: '\#/components/schemas/AgentResponseAgentResponseEvent'  
      required:  
        \- type  
    AgentResponseCorrectionAgentResponseCorrectionEvent:  
      type: object  
      properties:  
        original\_agent\_response:  
          type: string  
        corrected\_agent\_response:  
          type: string  
      required:  
        \- original\_agent\_response  
        \- corrected\_agent\_response  
    AgentResponseCorrection:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: agent\_response\_correction  
        agent\_response\_correction\_event:  
          $ref: \>-  
            \#/components/schemas/AgentResponseCorrectionAgentResponseCorrectionEvent  
      required:  
        \- type  
    AudioResponseAudioEvent:  
      type: object  
      properties:  
        audio\_base\_64:  
          type: string  
        event\_id:  
          type: integer  
    AudioResponse:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: audio  
        audio\_event:  
          $ref: '\#/components/schemas/AudioResponseAudioEvent'  
      required:  
        \- type  
    InterruptionInterruptionEvent:  
      type: object  
      properties:  
        event\_id:  
          type: integer  
    Interruption:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: interruption  
        interruption\_event:  
          $ref: '\#/components/schemas/InterruptionInterruptionEvent'  
      required:  
        \- type  
    PingPingEvent:  
      type: object  
      properties:  
        event\_id:  
          type: integer  
        ping\_ms:  
          type: integer  
    Ping:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: ping  
        ping\_event:  
          $ref: '\#/components/schemas/PingPingEvent'  
      required:  
        \- type  
    ClientToolCallClientToolCall:  
      type: object  
      properties:  
        tool\_name:  
          type: string  
        tool\_call\_id:  
          type: string  
        parameters:  
          type: object  
          additionalProperties:  
            description: Any type  
    ClientToolCall:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: client\_tool\_call  
        client\_tool\_call:  
          $ref: '\#/components/schemas/ClientToolCallClientToolCall'  
      required:  
        \- type  
    ContextualUpdate:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: contextual\_update  
        text:  
          type: string  
      required:  
        \- type  
        \- text  
    VadScoreVadScoreEvent:  
      type: object  
      properties:  
        vad\_score:  
          type: number  
          format: double  
      required:  
        \- vad\_score  
    VadScore:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: vad\_score  
        vad\_score\_event:  
          $ref: '\#/components/schemas/VadScoreVadScoreEvent'  
      required:  
        \- type  
    InternalTentativeAgentResponseTentativeAgentResponseInternalEvent:  
      type: object  
      properties:  
        tentative\_agent\_response:  
          type: string  
      required:  
        \- tentative\_agent\_response  
    InternalTentativeAgentResponse:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: internal\_tentative\_agent\_response  
        tentative\_agent\_response\_internal\_event:  
          $ref: \>-  
            \#/components/schemas/InternalTentativeAgentResponseTentativeAgentResponseInternalEvent  
      required:  
        \- type  
    V1ConvaiConversationSubscribe:  
      oneOf:  
        \- $ref: '\#/components/schemas/ConversationInitiationMetadata'  
        \- $ref: '\#/components/schemas/UserTranscript'  
        \- $ref: '\#/components/schemas/AgentResponse'  
        \- $ref: '\#/components/schemas/AgentResponseCorrection'  
        \- $ref: '\#/components/schemas/AudioResponse'  
        \- $ref: '\#/components/schemas/Interruption'  
        \- $ref: '\#/components/schemas/Ping'  
        \- $ref: '\#/components/schemas/ClientToolCall'  
        \- $ref: '\#/components/schemas/ContextualUpdate'  
        \- $ref: '\#/components/schemas/VadScore'  
        \- $ref: '\#/components/schemas/InternalTentativeAgentResponse'  
    UserAudioChunk:  
      type: object  
      properties:  
        user\_audio\_chunk:  
          type: string  
    Pong:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: pong  
        event\_id:  
          type: integer  
      required:  
        \- type  
    ConversationInitiationClientDataConversationConfigOverrideAgentPrompt:  
      type: object  
      properties:  
        prompt:  
          type: string  
    ConversationInitiationClientDataConversationConfigOverrideAgent:  
      type: object  
      properties:  
        prompt:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationClientDataConversationConfigOverrideAgentPrompt  
        first\_message:  
          type: string  
        language:  
          type: string  
    ConversationInitiationClientDataConversationConfigOverrideTts:  
      type: object  
      properties:  
        voice\_id:  
          type: string  
    ConversationInitiationClientDataConversationConfigOverride:  
      type: object  
      properties:  
        agent:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationClientDataConversationConfigOverrideAgent  
        tts:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationClientDataConversationConfigOverrideTts  
    ConversationInitiationClientDataCustomLlmExtraBody:  
      type: object  
      properties:  
        temperature:  
          type: number  
          format: double  
        max\_tokens:  
          type: integer  
    ConversationInitiationClientDataDynamicVariables:  
      oneOf:  
        \- type: string  
        \- type: number  
          format: double  
        \- type: integer  
        \- type: boolean  
    ConversationInitiationClientData:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: conversation\_initiation\_client\_data  
        conversation\_config\_override:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationClientDataConversationConfigOverride  
        custom\_llm\_extra\_body:  
          $ref: \>-  
            \#/components/schemas/ConversationInitiationClientDataCustomLlmExtraBody  
        dynamic\_variables:  
          type: object  
          additionalProperties:  
            $ref: \>-  
              \#/components/schemas/ConversationInitiationClientDataDynamicVariables  
      required:  
        \- type  
    ClientToolResult:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: client\_tool\_result  
        tool\_call\_id:  
          type: string  
        result:  
          type: string  
        is\_error:  
          type: boolean  
      required:  
        \- type  
    UserMessage:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: user\_message  
        text:  
          type: string  
      required:  
        \- type  
    UserActivity:  
      type: object  
      properties:  
        type:  
          type: string  
          enum:  
            \- type: stringLiteral  
              value: user\_activity  
      required:  
        \- type  
    V1ConvaiConversationPublish:  
      oneOf:  
        \- $ref: '\#/components/schemas/UserAudioChunk'  
        \- $ref: '\#/components/schemas/Pong'  
        \- $ref: '\#/components/schemas/ConversationInitiationClientData'  
        \- $ref: '\#/components/schemas/ClientToolResult'  
        \- $ref: '\#/components/schemas/ContextualUpdate'  
        \- $ref: '\#/components/schemas/UserMessage'  
        \- $ref: '\#/components/schemas/UserActivity'

\`\`\`  
