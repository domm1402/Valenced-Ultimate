#include <jni.h>
#include <memory>
#include <condition_variable>
#include <chrono>
#include <string>
#include <mutex>
#include <thread>
#define DISCORDPP_IMPLEMENTATION
#include "discordpp.h"

namespace {
std::unique_ptr<discordpp::Client> client;
std::mutex clientMutex;

std::string fromJava(JNIEnv* env, jstring value) {
    if (!value) return {};
    const char* chars = env->GetStringUTFChars(value, nullptr);
    std::string result = chars ? chars : "";
    if (chars) env->ReleaseStringUTFChars(value, chars);
    return result;
}
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_domms_presence_PresenceNative_update(JNIEnv* env, jobject, jstring appIdValue, jstring gameNameValue, jstring detailsValue, jstring stateValue, jstring imageKeyValue, jlong startTime) {
    std::lock_guard<std::mutex> lock(clientMutex);
    try {
        const auto appId = std::stoull(fromJava(env, appIdValue));
        if (appId == 0) return JNI_FALSE;
        if (!client) client = std::make_unique<discordpp::Client>();
        client->SetApplicationId(appId);
        discordpp::Activity activity{};
        activity.SetType(discordpp::ActivityTypes::Playing);
        const auto gameName = fromJava(env, gameNameValue);
        const auto details = fromJava(env, detailsValue);
        const auto state = fromJava(env, stateValue);
        const auto imageKey = fromJava(env, imageKeyValue);
        const auto activityDetails = details.empty() ? gameName : gameName + " | " + details;
        if (!activityDetails.empty()) activity.SetDetails(activityDetails);
        if (!state.empty()) activity.SetState(state);
        if (!imageKey.empty()) {
            discordpp::ActivityAssets assets{};
            assets.SetLargeImage(imageKey);
            activity.SetAssets(assets);
        }
        discordpp::ActivityTimestamps timestamps{};
        timestamps.SetStart(static_cast<uint64_t>(startTime > 0 ? startTime : std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count()));
        activity.SetTimestamps(timestamps);
        std::mutex resultMutex;
        std::condition_variable resultReady;
        bool completed = false;
        bool successful = false;
        client->UpdateRichPresence(std::move(activity), [&](discordpp::ClientResult result) {
            {
                std::lock_guard<std::mutex> resultLock(resultMutex);
                successful = result.Successful();
                completed = true;
            }
            resultReady.notify_one();
        });
        const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(8);
        while (std::chrono::steady_clock::now() < deadline) {
            discordpp::RunCallbacks();
            {
                std::lock_guard<std::mutex> resultLock(resultMutex);
                if (completed) return successful ? JNI_TRUE : JNI_FALSE;
            }
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }
        return JNI_FALSE;
    } catch (...) {
        return JNI_FALSE;
    }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_domms_presence_PresenceNative_clear(JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(clientMutex);
    if (!client) return JNI_TRUE;
    client->ClearRichPresence();
    for (int i = 0; i < 10; ++i) {
        discordpp::RunCallbacks();
        std::this_thread::sleep_for(std::chrono::milliseconds(10));
    }
    return JNI_TRUE;
}
