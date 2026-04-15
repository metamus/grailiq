import UserNotifications

class NotificationService: UNNotificationServiceExtension {
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?

    override func didReceive(
        _ request: UNNotificationRequest,
        withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void
    ) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)

        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }

        // Extract imageUrl from push payload
        let userInfo = request.content.userInfo
        guard let imageUrlString = userInfo["imageUrl"] as? String,
              let imageUrl = URL(string: imageUrlString) else {
            // No image URL in payload, use request content as-is
            contentHandler(bestAttemptContent)
            return
        }

        // Download the image and attach it to the notification
        downloadAndAttachImage(imageUrl: imageUrl, to: bestAttemptContent) { content in
            contentHandler(content)
        }
    }

    override func serviceExtensionTimeWillExpire() {
        // Called if the extension takes too long; send what we have
        if let bestAttemptContent = bestAttemptContent {
            contentHandler?(bestAttemptContent)
        }
    }

    // MARK: - Image Download

    private func downloadAndAttachImage(
        imageUrl: URL,
        to content: UNMutableNotificationContent,
        completion: @escaping (UNNotificationContent) -> Void
    ) {
        let task = URLSession.shared.dataTask(with: imageUrl) { [weak self] data, _, error in
            defer { completion(content) }

            guard let data = data, error == nil else {
                // Download failed; send notification without image
                return
            }

            // Write image to temporary file
            let tempDirectory = NSTemporaryDirectory()
            let fileName = UUID().uuidString + ".jpg"
            let tempFileUrl = URL(fileURLWithPath: tempDirectory).appendingPathComponent(fileName)

            do {
                try data.write(to: tempFileUrl)

                // Create UNNotificationAttachment from the temp file
                let attachment = try UNNotificationAttachment(
                    identifier: "restock-alert-image",
                    url: tempFileUrl,
                    options: [:]
                )

                // Attach to notification content
                content.attachments = [attachment]

                // Apply ciStickerEffect style for image display
                content.categoryIdentifier = "restock_alert"

            } catch {
                // Attachment creation or file write failed; send notification without image
                return
            }
        }

        task.resume()
    }
}
