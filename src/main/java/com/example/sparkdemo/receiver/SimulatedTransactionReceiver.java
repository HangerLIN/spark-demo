package com.example.sparkdemo.receiver;

import org.apache.spark.streaming.receiver.Receiver;
import org.apache.spark.storage.StorageLevel;
import com.example.sparkdemo.model.Transaction;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.atomic.AtomicBoolean;

public class SimulatedTransactionReceiver extends Receiver<Transaction> {
    private AtomicBoolean isStopped = new AtomicBoolean(false);
    private Random random = new Random();
    private static final String[] USER_IDS = {"user1", "user2", "user3", "user4", "user5"};
    private static final String[] PRODUCT_IDS = {"prod1", "prod2", "prod3", "prod4", "prod5"};

    public SimulatedTransactionReceiver() {
        super(StorageLevel.MEMORY_AND_DISK_2());
    }

    @Override
    public void onStart() {
        new Thread(this::generateData).start();
    }

    @Override
    public void onStop() {
        isStopped.set(true);
    }

    private void generateData() {
        while (!isStopped.get()) {
            Transaction transaction = generateRandomTransaction();
            store(transaction);
            try {
                Thread.sleep(1000); // 每秒生成一条交易数据
            } catch (InterruptedException e) {
                break;
            }
        }
    }

    private Transaction generateRandomTransaction() {
        String userId = USER_IDS[random.nextInt(USER_IDS.length)];
        String productId = PRODUCT_IDS[random.nextInt(PRODUCT_IDS.length)];
        double amount = 10 + random.nextDouble() * 990; // 10-1000之间的随机金额
        return new Transaction(userId, productId, amount, LocalDateTime.now());
    }
} 