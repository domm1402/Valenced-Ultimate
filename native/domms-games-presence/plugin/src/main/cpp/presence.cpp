#include <jni.h>
#include <memory>
#include <condition_variable>
#include <chrono>
#include <string>
#include <mutex>
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
Java_com_domms_presence_PresenceNative_update(JNIEnv* env, jobject, jstring appIdValue, jstring detailsValue, jstring stateValue) {
    std::lock_guard<std::mutex> lock(clientMutex);
    try {
        const auto appId = std::stoull(fromJava(env, appIdValue));
        if (appId == 0) return JNI_FALSE;
        if (!client) client = std::make_unique<discordpp::Client>();
        client->SetApplicationId(appId);
        discordpp::Activity activity{};
        activity.SetType(discordpp::ActivityTypes::Playing);
        const auto details = fromJava(env, detailsValue);
        const auto state = fromJava(env, stateValue);
        if (!details.empty()) activity.SetDetails(details);
        if (!state.empty()) activity.SetState(state);
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
        std::unique_lock<std::mutex> resultLock(resultMutex);
        if (!resultReady.wait_for(resultLock, std::chrono::seconds(8), [&] { return completed; })) {
            return JNI_FALSE;
        }
        return successful ? JNI_TRUE : JNI_FALSE;
    } catch (...) {
        return JNI_FALSE;
    }
}

extern "C" JNIEXPORT jboolean JNICALL
Java_com_domms_presence_PresenceNative_clear(JNIEnv*, jobject) {
    std::lock_guard<std::mutex> lock(clientMutex);
    if (!client) return JNI_TRUE;
    client->ClearRichPresence();
    return JNI_TRUE;
}
