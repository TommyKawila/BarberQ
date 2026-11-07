import {
  allowsPlatformAddFriendFallback,
  resolveShopAddFriendUrl,
} from "@/lib/line/add-friend-url";
import {
  getShopLineChannel,
  type ShopLineChannelPublic,
} from "@/lib/line/shop-channel";

type ChannelLookup = (shopId: string) => Promise<ShopLineChannelPublic | null>;

/**
 * Public booking settings helper: never throw if LINE channel lookup fails —
 * hide the add-friend button instead of 500-ing the whole page.
 */
export async function resolvePublicLineAddFriendUrl(
  shop: {
    id: string;
    slug: string;
    is_demo?: boolean | null;
  },
  deps?: { getChannel?: ChannelLookup },
): Promise<string | null> {
  const getChannel = deps?.getChannel ?? getShopLineChannel;
  let oaBasicId: string | null = null;
  try {
    const channel = await getChannel(shop.id);
    oaBasicId = channel?.oaBasicId ?? null;
  } catch {
    oaBasicId = null;
  }
  return resolveShopAddFriendUrl({
    oaBasicId,
    globalFallback: process.env.NEXT_PUBLIC_LINE_OA_ADD_URL,
    allowGlobalFallback: allowsPlatformAddFriendFallback(shop),
  });
}
