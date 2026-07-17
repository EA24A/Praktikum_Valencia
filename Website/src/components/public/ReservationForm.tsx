"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Users, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { tx } from "@/lib/tx";
import type { TimeSlot } from "@prisma/client";
import DatePicker from "@/components/ui/DatePicker";

const schema = z.object({
  date: z.string().min(1, "Required"),
  slotId: z.string().min(1, "Required"),
  partySize: z.number().min(1).max(20),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  timeSlots: TimeSlot[];
  locale: string;
};

export default function ReservationForm({ timeSlots, locale }: Props) {
  const [success, setSuccess] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { partySize: 2 },
  });

  const selectedDate = watch("date");

  const handleDateChange = async (date: string) => {
    setValue("date", date);
    setValue("slotId", "");

    if (!date) return;

    const dayOfWeek = new Date(date + "T12:00:00").getDay();
    const res = await fetch(`/api/reservations/slots?date=${date}&dayOfWeek=${dayOfWeek}`);
    const data = await res.json();
    setAvailableSlots(data.slots ?? []);
  };

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      toast.error(json.error ?? tx(locale, "Error al crear la reserva", "Failed to create booking", "تعذّر إنشاء الحجز", "Reservierung fehlgeschlagen"));
      return;
    }

    setBookingRef(json.reservationNumber);
    setSuccess(true);

    if (json.emailSent === false) {
      toast.warning(
        tx(
          locale,
          "Reserva creada, pero no pudimos enviar el email de confirmación. Te llamaremos si es necesario.",
          "Booking created, but we couldn't send the confirmation email. We'll call you if needed.",
          "تم إنشاء الحجز، لكن تعذّر إرسال بريد التأكيد. سنتصل بك إذا لزم الأمر.",
          "Reservierung erstellt, aber die Bestätigungs-E-Mail konnte nicht gesendet werden. Wir rufen Sie bei Bedarf an."
        )
      );
    }
  };

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  if (success) {
    return (
      <div className="card-warm rounded-2xl p-10 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h2 className="font-display text-3xl text-[var(--espresso)] mb-2">
          {tx(locale, "¡Reserva recibida!", "Booking received!", "تم استلام الحجز!", "Reservierung erhalten!")}
        </h2>
        <p className="font-body text-[var(--olive)] mb-4">
          {tx(
            locale,
            "Te enviaremos un email de confirmación en breve.",
            "We'll send you a confirmation email shortly.",
            "سنرسل لك بريد تأكيد قريباً.",
            "Wir senden Ihnen in Kürze eine Bestätigungs-E-Mail."
          )}
        </p>
        <div className="bg-[var(--muted)] rounded-xl p-4 inline-block">
          <div className="font-body text-xs text-[var(--olive)] mb-1">
            {tx(locale, "Referencia", "Reference", "المرجع", "Referenz")}
          </div>
          <div className="font-display text-xl text-[var(--espresso)] font-semibold">
            {bookingRef}
          </div>
        </div>
        <p className="font-body text-sm text-[var(--olive)]/70 mt-4">
          {tx(
            locale,
            "Si tienes alguna pregunta, llámanos al +34 600 345 055",
            "For any questions, call us at +34 600 345 055",
            "لأي استفسار، اتصل بنا على +34 600 345 055",
            "Bei Fragen rufen Sie uns an unter +34 600 345 055"
          )}
        </p>
      </div>
    );
  }

  const inputClass = "w-full bg-[var(--warm-white)] border border-[var(--border)] rounded-lg px-4 py-3 font-body text-sm text-[var(--espresso)] focus:outline-none focus:border-[var(--terracotta)] transition-colors placeholder:text-[var(--olive)]/50";
  const labelClass = "block font-body text-sm text-[var(--espresso-light)] mb-1.5";
  const errorClass = "font-body text-xs text-red-500 mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card-warm rounded-2xl p-6 sm:p-8 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Date */}
        <div>
          <label className={labelClass}>
            <Calendar size={14} className="inline mr-1.5 text-[var(--terracotta)]" />
            {tx(locale, "Fecha", "Date", "التاريخ", "Datum")}
          </label>
          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                minDate={minDate}
                locale={locale}
                placeholder={tx(locale, "Selecciona una fecha", "Select a date", "اختر تاريخاً", "Datum wählen")}
                className={inputClass}
                onChange={(date) => {
                  field.onChange(date);
                  void handleDateChange(date);
                }}
              />
            )}
          />
          {errors.date && <p className={errorClass}>{tx(locale, "Selecciona una fecha", "Select a date", "اختر تاريخاً", "Datum wählen")}</p>}
        </div>

        {/* Party size */}
        <div>
          <label className={labelClass}>
            <Users size={14} className="inline mr-1.5 text-[var(--terracotta)]" />
            {tx(locale, "Número de personas", "Number of guests", "عدد الأشخاص", "Anzahl der Gäste")}
          </label>
          <select
            className={inputClass}
            {...register("partySize", { valueAsNumber: true })}
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const label =
                locale === "es"
                  ? n === 1 ? "persona" : "personas"
                  : locale === "ar"
                  ? n === 1 ? "شخص" : "أشخاص"
                  : locale === "de"
                  ? n === 1 ? "Gast" : "Gäste"
                  : n === 1 ? "guest" : "guests";
              return (
                <option key={n} value={n}>
                  {n} {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <label className={labelClass}>
            <Clock size={14} className="inline mr-1.5 text-[var(--terracotta)]" />
            {tx(locale, "Hora de llegada", "Arrival time", "وقت الوصول", "Ankunftszeit")}
          </label>
          {availableSlots.length === 0 ? (
            <div className="bg-[var(--muted)] rounded-lg p-4 text-center font-body text-sm text-[var(--olive)]">
              {tx(
                locale,
                "No hay disponibilidad para esta fecha. Por favor, elige otro día.",
                "No availability for this date. Please choose another day.",
                "لا تتوفر طاولات في هذا التاريخ. الرجاء اختيار يوم آخر.",
                "Keine Verfügbarkeit an diesem Datum. Bitte wählen Sie einen anderen Tag."
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <label key={slot.id} className="cursor-pointer">
                  <input
                    type="radio"
                    value={slot.id}
                    className="sr-only peer"
                    {...register("slotId")}
                  />
                  <div className="text-center py-2.5 px-3 rounded-lg border border-[var(--border)] font-body text-sm text-[var(--espresso-light)] peer-checked:bg-[var(--terracotta)] peer-checked:text-white peer-checked:border-[var(--terracotta)] hover:border-[var(--terracotta)] transition-all">
                    {slot.startTime}
                  </div>
                </label>
              ))}
            </div>
          )}
          {errors.slotId && <p className={errorClass}>{tx(locale, "Selecciona una hora", "Select a time", "اختر وقتاً", "Uhrzeit wählen")}</p>}
        </div>
      )}

      <hr className="border-[var(--border)]" />

      {/* Personal details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{tx(locale, "Nombre completo", "Full name", "الاسم الكامل", "Vollständiger Name")}</label>
          <input type="text" className={inputClass} placeholder="María García" {...register("name")} />
          {errors.name && <p className={errorClass}>{tx(locale, "Nombre requerido", "Name required", "الاسم مطلوب", "Name erforderlich")}</p>}
        </div>
        <div>
          <label className={labelClass}>{tx(locale, "Teléfono", "Phone", "الهاتف", "Telefon")}</label>
          <input type="tel" className={inputClass} placeholder="+34 600 000 000" {...register("phone")} />
          {errors.phone && <p className={errorClass}>{tx(locale, "Teléfono requerido", "Phone required", "رقم الهاتف مطلوب", "Telefonnummer erforderlich")}</p>}
        </div>
      </div>

      <div>
        <label className={labelClass}>{tx(locale, "Correo electrónico", "Email address", "البريد الإلكتروني", "E-Mail-Adresse")}</label>
        <input type="email" className={inputClass} placeholder="maria@ejemplo.com" {...register("email")} />
        {errors.email && <p className={errorClass}>{tx(locale, "Email válido requerido", "Valid email required", "بريد إلكتروني صحيح مطلوب", "Gültige E-Mail erforderlich")}</p>}
      </div>

      <div>
        <label className={labelClass}>{tx(locale, "Peticiones especiales (opcional)", "Special requests (optional)", "طلبات خاصة (اختياري)", "Besondere Wünsche (optional)")}</label>
        <textarea
          rows={3}
          className={inputClass}
          placeholder={tx(
            locale,
            "Alergias, ocasiones especiales, silla para bebé...",
            "Allergies, special occasions, high chair...",
            "حساسيات، مناسبات خاصة، كرسي أطفال...",
            "Allergien, besondere Anlässe, Hochstuhl..."
          )}
          {...register("notes")}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full justify-center text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {tx(locale, "Enviando...", "Sending...", "جارٍ الإرسال...", "Wird gesendet...")}
          </>
        ) : (
          tx(locale, "Confirmar reserva", "Confirm booking", "تأكيد الحجز", "Reservierung bestätigen")
        )}
      </button>
    </form>
  );
}
